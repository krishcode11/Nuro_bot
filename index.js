require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');
const { NewMessage } = require('telegram/events');
const axios = require('axios');
const keep_alive = require('./server.js')

// Import our conversion module
const LinkConverter = require('./conversion');

// Configuration
const CONFIG = {
    API_ID: process.env.API_ID,
    API_HASH: process.env.API_HASH,
    PHONE: process.env.PHONE_NUMBER,
    
    // Channel IDs - Support multiple source channels
    SOURCE_CHANNELS: (() => {
        const sourceIds = process.env.SOURCE_CHANNEL_IDS;
        if (!sourceIds) {
            console.log('⚠️ SOURCE_CHANNEL_IDS not found in .env file');
            return [];
        }
        
        try {
            let channels = [];
            
            // Check if it's a JSON array format
            if (sourceIds.startsWith('[') && sourceIds.endsWith(']')) {
                channels = JSON.parse(sourceIds);
            } else {
                channels = sourceIds.split(',').map(id => id.trim());
            }
            
            // Convert channels to proper format
            return channels.map(id => {
                const channelId = String(id);
                console.log(`🔍 Processing channel ID: ${channelId}`);
                
                if (channelId.startsWith('-100')) {
                    console.log(`✅ Converting -100 format: ${channelId} -> ${channelId.substring(4)}`);
                    return channelId.substring(4);
                }
                if (channelId.startsWith('-')) {
                    console.log(`✅ Converting - format: ${channelId} -> ${channelId.substring(1)}`);
                    return channelId.substring(1);
                }
                
                console.log(`✅ Using channel ID as is: ${channelId}`);
                return channelId;
            });
        } catch (e) {
            console.error('❌ Error parsing SOURCE_CHANNEL_IDS:', e);
            console.error('💡 Expected format: ["1234567890","0987654321"] or 1234567890,0987654321');
            return [];
        }
    })(),
    
    DESTINATION_CHANNEL: process.env.DESTINATION_CHANNEL_ID,
    
    // Affiliate IDs
    AMAZON_TAG: process.env.AMAZON_TAG,
    EARNKARO_ID: process.env.EARNKARO_ID,
    EARNPE_ID: process.env.EARNPE_ID,
    
    // URL Shortening
    BITLY_TOKEN: process.env.BITLY_TOKEN
};

// Attractive promotional messages array
const PROMOTIONAL_MESSAGES = [
    "\n\n💰 Heavy Discount Shopping Deals sirf @NuroLoots pe! 🔥\n🛍️ Join kariye aaj hi or paise bachaye har shopping mein! 💸",
    
    "\n\n🎯 Shopping ka Maza Double karo! Heavy Discounts + Cash Back! 💰\n🔥 @NuroLoots - Apka Trusted Deal Partner! Join now! 🚀",
    
    "\n\n💥 Paisa Bachao, Shopping Karo! Daily Best Deals only @NuroLoots pe! 🛒\n✨ Maximum Savings with Minimum Price! Join karo abhi! 💎",
    
    "\n\n🌟 Smart Shopping = Smart Savings! Heavy Discount Deals Daily! 💸\n🔥 @NuroLoots pe join karo or become a Smart Shopper! 🧠💰",
    
    "\n\n🎊 Shopping Festival Everyday! Massive Discounts + Extra Cashback! 🎁\n💯 @NuroLoots - Your Money Saving Partner! Join today! 🚀",
    
    "\n\n🛍️ Save Your Money Magic! Heavy Discounts Guaranteed! ✨\n💰 @NuroLoots pe daily naye deals! Join karo aaj hi! 🔥",
    
    "\n\n💸 Paise Ki Baarish! Heavy Discount Shopping Deals har din! 🌧️💰\n🎯 @NuroLoots - Apka Personal Deal Hunter! Join now! 🏹",
    
    "\n\n🔥 Shopping Revolution! Heavy Discounts + Extra Benefits! 🚀\n💎 @NuroLoots pe smart shopping with maximum savings! ✨",
    
    "\n\n🎪 Shopping Carnival! Heavy Discount Deals + Surprise Offers! 🎊\n💰 @NuroLoots - Where Shopping Meets Savings! Join abhi! 🛒",
    
    "\n\n⚡ Flash Shopping! Heavy Discounts, Light Prices! 💨\n🔥 @NuroLoots pe daily deals jo apka paisa bachayenge! Join today! 💸"
];

// Initialize Link Converter
const linkConverter = new LinkConverter(CONFIG);

// Logging setup
const logStream = fs.createWriteStream(path.join(__dirname, 'deal_bot.log'), { flags: 'a' });

function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [MAIN] [${type}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

// Rate limiting
let lastSentTime = 0;
const MIN_DELAY = 2000; // 2 seconds between messages

async function rateLimitedDelay() {
    const now = Date.now();
    const timeSinceLastSent = now - lastSentTime;
    
    if (timeSinceLastSent < MIN_DELAY) {
        const waitTime = MIN_DELAY - timeSinceLastSent;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastSentTime = Date.now();
}

// Get random promotional message
function getRandomPromotionalMessage() {
    const randomIndex = Math.floor(Math.random() * PROMOTIONAL_MESSAGES.length);
    return PROMOTIONAL_MESSAGES[randomIndex];
}

// Helper function to build clean Amazon links using amzn.to/dp/ASIN format
function buildShortAmazonLink(originalUrl) {
    if (!CONFIG.AMAZON_TAG) {
        log('⚠️ Amazon tag not configured - returning original URL');
        return originalUrl;
    }
    
    try {
        // Extract ASIN using regex patterns for different Amazon URL formats
        const asinPatterns = [
            /\/dp\/([A-Z0-9]{10})/,           // /dp/ASIN
            /\/gp\/product\/([A-Z0-9]{10})/,   // /gp/product/ASIN
            /\/ASIN\/([A-Z0-9]{10})/,          // /ASIN/ASIN
            /\/d\/([A-Z0-9]{10})/,             // /d/ASIN (shortened format)
            /\/dp\/([A-Z0-9]{10})/,            // /dp/ASIN (alternative)
            /\/product\/([A-Z0-9]{10})/        // /product/ASIN
        ];
        
        let asin = null;
        
        // Try each pattern to extract ASIN
        for (const pattern of asinPatterns) {
            const match = originalUrl.match(pattern);
            if (match && match[1]) {
                asin = match[1];
                log(`🔍 Extracted ASIN: ${asin} from URL: ${originalUrl}`);
                break;
            }
        }
        
        if (!asin) {
            log(`❌ Could not extract ASIN from URL: ${originalUrl}`);
            return originalUrl;
        }
        
        // Build the clean Amazon link
        const cleanAmazonLink = `https://www.amzn.to/dp/${asin}?tag=${CONFIG.AMAZON_TAG}`;
        log(`✅ Built clean Amazon link: ${cleanAmazonLink}`);
        
        return cleanAmazonLink;
        
    } catch (error) {
        log(`❌ Error building Amazon link: ${error.message}`, 'ERROR');
        return originalUrl;
    }
}

// Enhanced message formatting
async function formatDealMessage(originalText) {
    log('🎨 Starting message formatting...');
    
    if (!originalText) {
        log('⚠️ No text provided for formatting');
        return '';
    }
    
    // Convert affiliate links using our conversion module (includes Flipkart deep linking)
    log('🔗 Converting affiliate links...');
    let formattedText = await linkConverter.convertAllLinks(originalText);
    
    // Replace Amazon links with clean amzn.to/dp/ASIN format
    log('🛒 Converting Amazon links to clean format...');
    const amazonUrlRegex = /https?:\/\/(?:www\.)?(?:amazon\.(?:in|com|co\.uk|de|fr|it|es|co\.jp|ca|com\.au|com\.mx|com\.br|ae|sa|sg|com\.tr)|amzn\.to)\/[^\s\]}\)>\n\r]*/gi;
    const amazonUrls = formattedText.match(amazonUrlRegex);
    
    if (amazonUrls) {
        log(`🔍 Found ${amazonUrls.length} Amazon URLs to convert`);
        for (const url of amazonUrls) {
            try {
                const cleanLink = buildShortAmazonLink(url);
                formattedText = formattedText.replace(url, cleanLink);
                log(`✅ Converted Amazon URL: ${url.substring(0, 50)}... → ${cleanLink}`);
            } catch (error) {
                log(`❌ Error converting Amazon URL: ${error.message}`, 'ERROR');
            }
        }
    }
    
    // Add deal emojis if not present
    if (!formattedText.includes('🔥') && !formattedText.includes('💥') && !formattedText.includes('⚡')) {
        formattedText = `🔥 ${formattedText}`;
        log('✨ Added fire emoji to message');
    }
    
    // Add random promotional message if not already present
    if (!formattedText.toLowerCase().includes('@nuroloots')) {
        const promoMessage = getRandomPromotionalMessage();
        formattedText += promoMessage;
        log('✨ Added promotional message to deal');
    }
    
    log('✅ Message formatting completed');
    log(`📊 Final message length: ${formattedText.length} characters`);
    
    return formattedText;
}

// Send message with retry logic
async function sendDealMessage(client, text, media = null, maxRetries = 3) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            await rateLimitedDelay();
            
            if (media && ['MessageMediaPhoto', 'MessageMediaDocument', 'MessageMediaVideo'].includes(media.className)) {
                // Send with media
                await client.sendFile(CONFIG.DESTINATION_CHANNEL, media, {
                    caption: text,
                    parseMode: 'html'
                });
                log(`📸 Message with media sent successfully`);
            } else {
                // Send text only
                await client.sendMessage(CONFIG.DESTINATION_CHANNEL, {
                    message: text,
                    parseMode: 'html'
                });
                log(`💬 Text message sent successfully`);
            }
            
            log(`✅ Deal forwarded successfully to ${CONFIG.DESTINATION_CHANNEL}`, 'SUCCESS');
            return true;
            
        } catch (error) {
            attempt++;
            log(`❌ Send attempt ${attempt} failed: ${error.message}`, 'ERROR');
            
            // Check for permanent errors
            if (error.message.includes('CHAT_WRITE_FORBIDDEN') || 
                error.message.includes('CHANNEL_PRIVATE') ||
                error.message.includes('USER_BANNED_IN_CHANNEL')) {
                log(`🚫 Permanent error detected - stopping retries`, 'ERROR');
                break;
            }
            
            if (attempt < maxRetries) {
                const delay = 3000 * attempt;
                log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    log(`❌ Failed to send message after ${maxRetries} attempts`, 'ERROR');
    return false;
}

// Setup Telegram client
async function setupClient() {
    const sessionPath = path.join(__dirname, 'deal_bot_session.txt');
    let stringSession = new StringSession('');
    
    if (fs.existsSync(sessionPath)) {
        stringSession = new StringSession(fs.readFileSync(sessionPath, 'utf8'));
        log('📱 Loading existing session');
    } else {
        log('🆕 Creating new session');
    }
    
    const client = new TelegramClient(stringSession, Number(CONFIG.API_ID), CONFIG.API_HASH, {
        connectionRetries: 5,
        requestRetries: 3,
        retryDelay: 1000
    });
    
    await client.start({
        phoneNumber: async () => CONFIG.PHONE,
        password: async () => await input.text('Enter 2FA password (if enabled): '),
        phoneCode: async () => await input.text('Enter verification code: '),
        onError: (err) => log(`Auth error: ${err.message}`, 'ERROR'),
    });
    
    // Save session
    fs.writeFileSync(sessionPath, client.session.save());
    log(`🚀 Client started successfully for ${CONFIG.PHONE}`);
    
    return client;
}

// Display conversion statistics
function displayStats() {
    const stats = linkConverter.getStats();
    
    log('📊 CONVERSION STATISTICS:');
    log(`   🔗 Amazon conversions: ${stats.amazon}`);
    log(`   💰 EarnPe conversions: ${stats.earnpe}`);
    log(`   🛒 EarnKaro conversions: ${stats.earnkaro}`);
    log(`   📈 Total conversions: ${stats.total}`);
    log(`   🏪 EarnPe platforms: ${stats.platforms.earnpe}`);
    log(`   🏪 EarnKaro platforms: ${stats.platforms.earnkaro}`);
}

// Main bot function
async function startDealBot() {
    try {
        log('🤖 Starting Enhanced Affiliate Deal Bot with Modular Link Conversion...');
        
        // Validate configuration
        if (!CONFIG.API_ID || !CONFIG.API_HASH || !CONFIG.PHONE) {
            throw new Error('Missing required configuration: API_ID, API_HASH, or PHONE');
        }
        
        if (!CONFIG.SOURCE_CHANNELS.length || !CONFIG.DESTINATION_CHANNEL) {
            throw new Error('Missing channel configuration: SOURCE_CHANNEL_IDS or DESTINATION_CHANNEL_ID');
        }
        
        log(`📋 Configuration Status:`);
        log(`   Source Channels: ${CONFIG.SOURCE_CHANNELS.length} channels configured`);
        CONFIG.SOURCE_CHANNELS.forEach((channel, index) => {
            log(`     ${index + 1}. Channel ID: ${channel}`);
        });
        log(`   Destination Channel: ${CONFIG.DESTINATION_CHANNEL}`);
        log(`   Amazon Tag: ${CONFIG.AMAZON_TAG ? '✅ CONFIGURED' : '❌ NOT SET'}`);
        log(`   EarnKaro ID: ${CONFIG.EARNKARO_ID ? '✅ CONFIGURED' : '❌ NOT SET'}`);
        log(`   EarnPe ID: ${CONFIG.EARNPE_ID ? '✅ CONFIGURED' : '❌ NOT SET'}`);
        log(`   Promotional Messages: ${PROMOTIONAL_MESSAGES.length} variants loaded`);
        
        // Critical warnings
        if (!CONFIG.AMAZON_TAG) {
            log('🚨 CRITICAL: Amazon affiliate tag missing! Add AMAZON_TAG=your-tag in .env', 'ERROR');
        }
        if (!CONFIG.EARNKARO_ID && !CONFIG.EARNPE_ID) {
            log('⚠️  WARNING: No EarnKaro or EarnPe IDs configured', 'WARNING');
        }
        
        const client = await setupClient();
        await client.connect();
        
        // Test source channels access
        for (let i = 0; i < CONFIG.SOURCE_CHANNELS.length; i++) {
            const sourceChannel = CONFIG.SOURCE_CHANNELS[i];
            try {
                log(`🔍 Testing access to source channel ${i + 1}: ${sourceChannel}`);
                const sourceEntity = await client.getEntity(sourceChannel);
                log(`✅ Source channel ${i + 1} accessible: ${sourceEntity.title || sourceEntity.username || 'Private Channel'}`);
            } catch (sourceError) {
                log(`❌ Cannot access source channel ${i + 1} (${sourceChannel}): ${sourceError.message}`, 'ERROR');
                log(`💡 Ensure you're subscribed to channel ID: ${sourceChannel}`);
            }
        }
        
        // Test destination channel access
        try {
            log('🔍 Testing destination channel access...');
            const destEntity = await client.getEntity(CONFIG.DESTINATION_CHANNEL);
            log(`✅ Destination channel accessible: ${destEntity.title || destEntity.username || 'Private Channel'}`);
            
        } catch (destError) {
            log(`❌ Cannot access destination channel: ${destError.message}`, 'ERROR');
            log(`💡 Ensure bot has admin rights in destination channel: ${CONFIG.DESTINATION_CHANNEL}`);
            throw destError;
        }
        
        log('🎯 Setting up message handlers...');
        
        // Message handler for new messages
        client.addEventHandler(async (event) => {
            try {
                const message = event.message;
                const chatId = message.chatId?.toString();
                
                // Check if message is from one of our source channels
                const isFromSourceChannel = CONFIG.SOURCE_CHANNELS.some(sourceId => {
                    const normalizedChatId = chatId?.replace('-100', '');
                    return normalizedChatId === sourceId || chatId === sourceId || chatId === `-100${sourceId}`;
                });
                
                if (!isFromSourceChannel) {
                    return; // Ignore messages not from source channels
                }
                
                log(`📨 New message received from channel: ${chatId}`);
                log(`📝 Message preview: ${message.text ? message.text.substring(0, 100) + '...' : 'Media message'}`);
                
                // Process ALL messages (not just deal messages) to convert any links
                log('🎯 Processing message for link conversion...');
                
                // Format the message text
                const originalText = message.text || '';
                const formattedText = await formatDealMessage(originalText);
                
                if (!formattedText.trim()) {
                    log('⚠️ Formatted text is empty - skipping');
                    return;
                }
                
                // Get media if present
                let media = null;
                if (message.media) {
                    media = message.media;
                    log('📸 Media detected in message');
                }
                
                // Send the formatted message
                const success = await sendDealMessage(client, formattedText, media);
                
                if (success) {
                    log('🎉 Message forwarded successfully!', 'SUCCESS');
                    
                    // Display statistics every 10 successful forwards
                    if (linkConverter.getStats().total % 10 === 0) {
                        displayStats();
                    }
                } else {
                    log('❌ Failed to forward message', 'ERROR');
                }
                
            } catch (error) {
                log(`❌ Error processing message: ${error.message}`, 'ERROR');
                console.error('Full error:', error);
            }
        }, new NewMessage());
        
        log('✅ Message handlers registered successfully');
        log('🚀 Bot is now running and monitoring for deals...');
        log('📊 Initial statistics:');
        displayStats();
        
        // Keep the bot running
        console.log('\n🎯 Bot Status: ACTIVE');
        console.log('📡 Monitoring channels for new deals...');
        console.log('🛑 Press Ctrl+C to stop the bot\n');
        
        // Periodic health check
        setInterval(() => {
            if (client.connected) {
                log('💓 Bot health check: CONNECTED');
            } else {
                log('⚠️ Bot health check: DISCONNECTED - attempting reconnection...', 'WARNING');
                client.connect().catch(err => log(`❌ Reconnection failed: ${err.message}`, 'ERROR'));
            }
        }, 300000); // Every 5 minutes
        
        // Graceful shutdown handler
        process.on('SIGINT', async () => {
            log('🛑 Shutting down bot gracefully...');
            displayStats();
            
            await client.disconnect();
            logStream.end();
            log('✅ Bot shutdown completed');
            process.exit(0);
        });
        
        // Keep process alive
        await client.disconnected;
        
    } catch (error) {
        log(`❌ Critical error starting bot: ${error.message}`, 'ERROR');
        console.error('Full error details:', error);
        process.exit(1);
    }
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
});

process.on('uncaughtException', (error) => {
    log(`❌ Uncaught Exception: ${error.message}`, 'ERROR');
    console.error('Full error:', error);
    process.exit(1);
});

// Start the bot
if (require.main === module) {
    startDealBot().catch(error => {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    });
}

module.exports = {
    startDealBot,
    formatDealMessage,
    sendDealMessage,
    CONFIG
};
