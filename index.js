require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');
const { NewMessage } = require('telegram/events');
const { downloadMedia } = require('telegram/client/downloads');
require('./server.js');

// Configuration
const CONFIG = {
    API_ID: process.env.API_ID,
    API_HASH: process.env.API_HASH,
    PHONE: process.env.PHONE_NUMBER,
    SOURCE_CHANNELS: (() => {
        const sourceIds = process.env.SOURCE_CHANNEL_IDS;
        if (!sourceIds) {
            console.log('⚠️ SOURCE_CHANNEL_IDS not found in .env file');
            return [];
        }
        try {
            let channels = [];
            if (sourceIds.startsWith('[') && sourceIds.endsWith(']')) {
                channels = JSON.parse(sourceIds);
            } else {
                channels = sourceIds.split(',').map(id => id.trim());
            }
            return channels.map(id => {
                const channelId = String(id);
                if (channelId.startsWith('-100')) {
                    return channelId.substring(4);
                }
                if (channelId.startsWith('-')) {
                    return channelId.substring(1);
                }
                return channelId;
            });
        } catch (e) {
            console.error('❌ Error parsing SOURCE_CHANNEL_IDS:', e);
            return [];
        }
    })(),
    EARNPE_BOT_USERNAME: '@earnpe_converter1_bot',
};

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

// Define a formal promotional message array (formal, no 'loots' or informal words)
const PROMOTIONAL_MESSAGES = [
    "\n\n💰 Heavy Discount Shopping Deals only on our channel! 🔥\n🛍️ Join today and save on every purchase! 💸",
    "\n\n🎯 Double the fun of shopping! Heavy Discounts + Cash Back! 💰\n🔥 Trusted Deal Partner - Join now! 🚀",
    "\n\n💥 Save Money, Shop More! Daily Best Deals here! 🛒\n✨ Maximum Savings with Minimum Price! Join now! 💎",
    "\n\n🌟 Smart Shopping = Smart Savings! Heavy Discount Deals Daily! 💸\n🔥 Join and become a Smart Shopper! 🧠💰",
    "\n\n🎊 Shopping Festival Everyday! Massive Discounts + Extra Cashback! 🎁\n💯 Your Money Saving Partner! Join today! 🚀",
    "\n\n🛍️ Save Your Money! Heavy Discounts Guaranteed! ✨\n💰 Daily new deals! Join today! 🔥",
    "\n\n💸 Rain of Savings! Heavy Discount Shopping Deals every day! 🌧️💰\n🎯 Your Personal Deal Hunter! Join now! 🏹",
    "\n\n🔥 Shopping Revolution! Heavy Discounts + Extra Benefits! 🚀\n💎 Smart shopping with maximum savings! ✨",
    "\n\n🎪 Shopping Carnival! Heavy Discount Deals + Surprise Offers! 🎊\n💰 Where Shopping Meets Savings! Join now! 🛒",
    "\n\n⚡ Flash Shopping! Heavy Discounts, Light Prices! 💨\n🔥 Daily deals that save your money! Join today! 💸"
];

// Update forwardToEarnpeBot to only send text messages
async function forwardToEarnpeBot(client, message) {
    try {
        await rateLimitedDelay();
        await client.sendMessage(CONFIG.EARNPE_BOT_USERNAME, {
            message: message,
            parseMode: 'html'
        });
        log('✅ Message sent to @earnpe_converter1_bot');
    } catch (error) {
        log(`❌ Failed to send to @earnpe_converter1_bot: ${error.message}`, 'ERROR');
    }
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
    fs.writeFileSync(sessionPath, client.session.save());
    log(`🚀 Client started successfully for ${CONFIG.PHONE}`);
    return client;
}

// Main bot function
async function startForwardBot() {
    try {
        log('🤖 Starting Simple Forward Bot for EarnPe Converter...');
        if (!CONFIG.API_ID || !CONFIG.API_HASH || !CONFIG.PHONE) {
            throw new Error('Missing required configuration: API_ID, API_HASH, or PHONE');
        }
        if (!CONFIG.SOURCE_CHANNELS.length) {
            throw new Error('Missing channel configuration: SOURCE_CHANNEL_IDS');
        }
        log(`📋 Source Channels: ${CONFIG.SOURCE_CHANNELS.length} configured`);
        CONFIG.SOURCE_CHANNELS.forEach((channel, index) => {
            log(`     ${index + 1}. Channel ID: ${channel}`);
        });
        log(`   EarnPe Converter Bot: ${CONFIG.EARNPE_BOT_USERNAME}`);
        const client = await setupClient();
        await client.connect();
        client.addEventHandler(async (event) => {
            try {
                const message = event.message;
                if (!message) return;
                // --- Channel filtering logic ---
                let peerId = null;
                if (message.peerId && typeof message.peerId === 'object') {
                    if ('channelId' in message.peerId) peerId = message.peerId.channelId.toString();
                    else if ('chatId' in message.peerId) peerId = message.peerId.chatId.toString();
                }
                if (!peerId) return;
                if (!CONFIG.SOURCE_CHANNELS.includes(peerId)) return;
                // --- End channel filtering ---
                let text = message.text || message.message || '';
                // Add a random formal promotional message if not already present
                const promo = PROMOTIONAL_MESSAGES[Math.floor(Math.random() * PROMOTIONAL_MESSAGES.length)];
                if (!text.includes('Heavy Discount')) {
                    text += promo;
                }
                await forwardToEarnpeBot(client, text);
            } catch (error) {
                log(`❌ Error processing message: ${error.message}`, 'ERROR');
            }
        }, new NewMessage({}));
        log('✅ Message handler registered. Bot is running...');
        // Keep the bot running
        await client.disconnected;
    } catch (error) {
        log(`❌ Critical error starting bot: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

if (require.main === module) {
    startForwardBot();
}
