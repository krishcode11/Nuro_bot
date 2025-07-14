require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { NewMessage } = require('telegram/events');
const crypto = require('crypto');
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
                if (channelId.startsWith('-100')) return channelId.substring(4);
                if (channelId.startsWith('-')) return channelId.substring(1);
                return channelId;
            });
        } catch (e) {
            console.error('❌ Error parsing SOURCE_CHANNEL_IDS:', e);
            return [];
        }
    })(),
    EARNPE_BOT_USERNAME: '@earnpe_converter1_bot',
};

// Logging
const logStream = fs.createWriteStream(path.join(__dirname, 'deal_bot.log'), { flags: 'a' });
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [MAIN] [${type}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

// Rate limiting
let lastSentTime = 0;
const MIN_DELAY = 2000;
async function rateLimitedDelay() {
    const now = Date.now();
    const waitTime = MIN_DELAY - (now - lastSentTime);
    if (waitTime > 0) await new Promise(res => setTimeout(res, waitTime));
    lastSentTime = Date.now();
}

// Scrape product image
async function getProductImage(messageText) {
    try {
        const match = messageText.match(/https?:\/\/[^\s]+/);
        if (!match) return null;

        const productUrl = match[0];
        const res = await axios.get(productUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(res.data);
        const img = $('meta[property="og:image"]').attr('content') || $('#landingImage').attr('src');
        return img;
    } catch (err) {
        log(`❌ Image scrape failed: ${err.message}`, 'ERROR');
        return null;
    }
}

// Download image
async function downloadImageAsBuffer(imageUrl) {
    try {
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(res.data, 'binary');
    } catch (err) {
        log(`❌ Image download failed: ${err.message}`, 'ERROR');
        return null;
    }
}

// Promotional message pool
const PROMOTIONAL_MESSAGES = [
    "\n\n💰 Heavy Discount Shopping Deals only on our channel! 🔥\n🛍️ Join today and save on every purchase! 💸",
    "\n\n🎯 Double the fun of shopping! Heavy Discounts + Cash Back! 💰\n🔥 Trusted Deal Partner - Join now! 🚀",
    "\n\n💥 Save Money, Shop More! Daily Best Deals here! 🛒\n✨ Maximum Savings with Minimum Price! Join now! 💎",
    "\n\n🌟 Smart Shopping = Smart Savings! Heavy Discount Deals Daily! 💸\n🔥 Join and become a Smart Shopper! 🧠💰",
    "\n\n🎊 Shopping Festival Everyday! Massive Discounts + Extra Cashback! 🎁\n💯 Your Money Saving Partner! Join today! 🚀"
];

// ✅ Send message to EarnPe bot (with image if possible)
async function forwardToEarnpeBot(client, message) {
    try {
        await rateLimitedDelay();
        const imageUrl = await getProductImage(message);
        if (imageUrl) {
            const imageBuffer = await downloadImageAsBuffer(imageUrl);
            if (imageBuffer) {
                const fileName = `product_${crypto.randomBytes(4).toString('hex')}.jpg`;
                const tempPath = path.join(__dirname, fileName);
                fs.writeFileSync(tempPath, imageBuffer);
                
                await client.sendMessage(CONFIG.EARNPE_BOT_USERNAME, {
                    message,
                    parseMode: 'html',
                    linkPreview: true,
                    forceDocument: false,
                });
                log('✅ Message with image sent to @earnpe_converter1_bot');
                fs.unlinkSync(tempPath);
                return;
            }
        }
        // fallback to text-only
        await client.sendMessage(CONFIG.EARNPE_BOT_USERNAME, {
            message,
            parseMode: 'html'
        });
        log('✅ Text message sent (image fallback) to @earnpe_converter1_bot');
    } catch (error) {
        log(`❌ Failed to send to @earnpe_converter1_bot: ${error.message}`, 'ERROR');
    }
}

// Optional: second bot
async function forwardToEarnkaroBot(client, message) {
    const earnkaroBot = process.env.EARNKARO_BOT_USERNAME || '@ekconverter9bot';
    try {
        await rateLimitedDelay();
        const imageUrl = await getProductImage(message);
        if (imageUrl) {
            const imageBuffer = await downloadImageAsBuffer(imageUrl);
            if (imageBuffer) {
                const fileName = `product_${crypto.randomBytes(4).toString('hex')}.jpg`;
                const tempPath = path.join(__dirname, fileName);
                fs.writeFileSync(tempPath, imageBuffer);
                await client.sendFile(earnkaroBot, {
                    file: tempPath,
                    caption: message,
                    linkPreview: true,
                    forceDocument: false,
                    parseMode: 'html'
                });
                log('✅ Message with image sent to @ekconverter9bot');
                fs.unlinkSync(tempPath);
                return;
            }
        }

        // fallback text-only
        await client.sendMessage(earnkaroBot, {
            message,
            parseMode: 'html'
        });
        log('✅ Text message sent (image fallback) to @ekconverter9bot');
    } catch (error) {
        log(`❌ Failed to send to @ekconverter9bot: ${error.message}`, 'ERROR');
    }
}

// Setup Telegram session
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

// Main forward logic
async function startForwardBot() {
    try {
        log('🤖 Starting Deal Forward Bot...');
        if (!CONFIG.API_ID || !CONFIG.API_HASH || !CONFIG.PHONE) {
            throw new Error('Missing required configuration: API_ID, API_HASH, or PHONE');
        }
        if (!CONFIG.SOURCE_CHANNELS.length) {
            throw new Error('Missing channel configuration: SOURCE_CHANNEL_IDS');
        }

        const client = await setupClient();
        await client.connect();

        client.addEventHandler(async (event) => {
            try {
                const message = event.message;
                if (!message) return;

                // Filter channel
                let peerId = null;
                if (message.peerId && typeof message.peerId === 'object') {
                    if ('channelId' in message.peerId) peerId = message.peerId.channelId.toString();
                    else if ('chatId' in message.peerId) peerId = message.peerId.chatId.toString();
                }

                if (!peerId || !CONFIG.SOURCE_CHANNELS.includes(peerId)) return;

                let text = message.text || message.message || '';
                const promo = PROMOTIONAL_MESSAGES[Math.floor(Math.random() * PROMOTIONAL_MESSAGES.length)];
                if (!text.includes('Heavy Discount')) text += promo;

                await forwardToEarnpeBot(client, text);
                await forwardToEarnkaroBot(client, text); // optional
            } catch (error) {
                log(`❌ Error processing message: ${error.message}`, 'ERROR');
            }
        }, new NewMessage({}));

        log('✅ Message handler registered. Bot is running...');
        await client.disconnected;
    } catch (error) {
        log(`❌ Critical error starting bot: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

// Start the bot
if (require.main === module) {
    startForwardBot();
}
