# Telegram Affiliate Link Converter Bot

A powerful Telegram bot that automatically converts affiliate links from source channels and forwards them to destination channels with proper affiliate tracking.

## 🚀 Features

- **Multi-Platform Support**: Handles all major Indian e-commerce and service platforms
- **Smart Affiliate Routing**: Automatically routes platforms to appropriate affiliate networks
- **Clean Amazon Links**: Uses `amzn.to/dp/ASIN` format for Amazon links
- **Long URL Format**: Uses long URLs with affiliate IDs for better tracking
- **Silent Operation**: Processes all messages without startup/shutdown notifications
- **Comprehensive Logging**: Detailed conversion tracking and statistics
- **Multi-Channel Support**: Monitor multiple source channels simultaneously

## 📱 Supported Platforms

### EarnPe Affiliate Network
- **Flipkart** - Long URL format: `https://www.flipkart.com/product/123?affid=<earnpe-id>`
- **Myntra** - Long URL format: `https://www.myntra.com/product/456?affid=<earnpe-id>`
- **Ajio** - Long URL format: `https://www.ajio.com/product/789?affid=<earnpe-id>`
- **Tata Cliq** - Long URL format: `https://www.tatacliq.com/product/101?affid=<earnpe-id>`
- **Other Fashion/Beauty Platforms** - Long URLs with EarnPe affiliate ID appended

### EarnKaro Affiliate Network
- **Meesho** - Long URL format: `https://www.meesho.com/product/123?affid=<earnkaro-id>`
- **Paytm Mall** - Long URL format: `https://paytmmall.com/product/456?affid=<earnkaro-id>`
- **BigBasket** - Long URL format: `https://www.bigbasket.com/product/789?affid=<earnkaro-id>`
- **Swiggy** - Long URL format: `https://www.swiggy.com/restaurant/101?affid=<earnkaro-id>`
- **Zomato** - Long URL format: `https://www.zomato.com/restaurant/202?affid=<earnkaro-id>`
- **Other Food/Delivery Platforms** - Long URLs with EarnKaro affiliate ID appended

### Amazon (Special Handling)
- **Amazon Links** - Clean format: `https://www.amzn.to/dp/ASIN?tag=<amazon-tag>`
- **All Amazon Domains** - Supports amazon.in, amazon.com, amazon.co.uk, etc.
- **ASIN Extraction** - Automatically extracts ASIN from any Amazon URL format

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Telegram Bot Configuration
# Get these from https://my.telegram.org/apps
API_ID=your_telegram_api_id_here
API_HASH=your_telegram_api_hash_here
PHONE_NUMBER=your_phone_number_with_country_code

# Channel Configuration
# Source channels where bot will monitor for deals (comma separated or JSON array)
SOURCE_CHANNEL_IDS=["-1001234567890","-1000987654321"]
# Or use comma separated format: SOURCE_CHANNEL_IDS=-1001234567890,-1000987654321

# Destination channel where converted deals will be posted
DESTINATION_CHANNEL_ID=-1001234567890

# Affiliate Program IDs
# Amazon affiliate tag (get from Amazon Associates)
AMAZON_TAG=your-amazon-tag-20

# EarnKaro affiliate ID (get from EarnKaro dashboard)
EARNKARO_ID=your_earnkaro_id_here

# EarnPe affiliate ID (get from EarnPe dashboard)
EARNPE_ID=your_earnpe_id_here
```

### Required IDs

1. **EarnPe ID**: Your EarnPe affiliate ID for fashion/beauty platforms
2. **EarnKaro ID**: Your EarnKaro affiliate ID for food/delivery platforms  
3. **Amazon Tag**: Your Amazon Associates tag for Amazon links

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd telegrambot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Start the bot**:
   ```bash
   node index.js
   ```

## 📊 How It Works

### Link Conversion Process

1. **Message Detection**: Bot monitors source channels for messages containing URLs
2. **Platform Identification**: Automatically detects platform from URL domain
3. **Affiliate Routing**: Routes to appropriate affiliate network (EarnPe/EarnKaro)
4. **Link Generation**: Creates proper affiliate URLs with affiliate IDs
5. **Amazon Processing**: Extracts ASIN and creates clean `amzn.to/dp/ASIN` format
6. **Message Forwarding**: Sends converted links to destination channel

### Platform Routing Logic

- **EarnPe Platforms**: Fashion, beauty, electronics, general e-commerce
- **EarnKaro Platforms**: Food delivery, grocery, travel, services
- **Amazon**: Special handling with ASIN extraction and clean link format

## 📈 Tracking & Analytics

The bot provides comprehensive tracking:

- **Conversion Statistics**: Counts by platform and affiliate network
- **URL Mappings**: Stores all conversions in `url_mappings.json`
- **Detailed Logging**: All conversions logged to `conversion.log`

### Sample Statistics
```json
{
  "total": 150,
  "amazon": 45,
  "earnpe": 65,
  "earnkaro": 40
}
```

## 🔍 URL Format Examples

### Amazon
```
Original: https://www.amazon.in/Green-Electric-Scooter-Portable-Charger/dp/B0F3NMCJJ7/?_encoding=UTF8&ref_=pd_hp_d_btf_ci_mcx_mr_hp_atf_m
Converted: https://www.amzn.to/dp/B0F3NMCJJ7?tag=your-tag-20
```

### Flipkart
```
Original: https://www.flipkart.com/product/123
Converted: https://www.flipkart.com/product/123?affid=EP737765747479
```

### Myntra
```
Original: https://www.myntra.com/product/456
Converted: https://www.myntra.com/product/456?affid=EP737765747479
```

### Meesho
```
Original: https://www.meesho.com/product/789
Converted: https://www.meesho.com/product/789?affid=4455583
```

### URLs with Existing Parameters
```
Original: https://www.flipkart.com/product/123?utm_source=telegram&utm_medium=social
Converted: https://www.flipkart.com/product/123?utm_source=telegram&utm_medium=social&affid=EP737765747479
```

## 🚨 Troubleshooting

### Common Issues

1. **Invalid Affiliate IDs**: Ensure EarnPe and EarnKaro IDs are correct
2. **Channel Access**: Verify bot has access to both source and destination channels
3. **Environment Variables**: Ensure all required variables are set in `.env`
4. **Session Issues**: Delete `deal_bot_session.txt` if authentication fails

### Log Files

- `conversion.log` - Detailed conversion logs
- `deal_bot.log` - Bot operation logs
- `url_mappings.json` - URL conversion mappings

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository. 