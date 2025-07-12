// conversion.js - Enhanced Link Conversion Module
const fs = require("fs");
const path = require("path");

// Setup logging for conversion module
const logStream = fs.createWriteStream(path.join(__dirname, "conversion.log"), {
    flags: "a",
});

function conversionLog(message, type = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [CONVERSION] [${type}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + "\n");
}

class LinkConverter {
    constructor(config) {
        this.config = config;
        this.conversionStats = {
            amazon: 0,
            earnkaro: 0,
            earnpe: 0,
            total: 0,
        };

        // Initialize supported platforms
        this.initializePlatforms();

        // Load existing URL mappings
        this.loadUrlMappings();
    }

    initializePlatforms() {
        // EarnPe supported platforms with improved regex including shortened URLs
        this.earnPePlatforms = {
            "flipkart.com":
                /https?:\/\/(?:www\.)?(?:dl\.)?flipkart\.com\/[^\s\]}\)>\n\r]*/gi,
            "fkrt.to": /https?:\/\/(?:www\.)?fkrt\.to\/[^\s\]}\)>\n\r]*/gi,
            "myntra.com":
                /https?:\/\/(?:www\.)?myntra\.com\/[^\s\]}\)>\n\r]*/gi,
            "mynt.ro": /https?:\/\/(?:www\.)?mynt\.ro\/[^\s\]}\)>\n\r]*/gi,
            "ajio.com": /https?:\/\/(?:www\.)?ajio\.com\/[^\s\]}\)>\n\r]*/gi,
            "tatacliq.com":
                /https?:\/\/(?:www\.)?tatacliq\.com\/[^\s\]}\)>\n\r]*/gi,
            "boat-lifestyle.com":
                /https?:\/\/(?:www\.)?boat-lifestyle\.com\/[^\s\]}\)>\n\r]*/gi,
            "nykaa.com": /https?:\/\/(?:www\.)?nykaa\.com\/[^\s\]}\)>\n\r]*/gi,
            "croma.com": /https?:\/\/(?:www\.)?croma\.com\/[^\s\]}\)>\n\r]*/gi,
            "samsung.com":
                /https?:\/\/(?:www\.)?samsung\.com\/[^\s\]}\)>\n\r]*/gi,
            "oneplus.in":
                /https?:\/\/(?:www\.)?oneplus\.in\/[^\s\]}\)>\n\r]*/gi,
            "gonoise.com":
                /https?:\/\/(?:www\.)?gonoise\.com\/[^\s\]}\)>\n\r]*/gi,
            "firstcry.com":
                /https?:\/\/(?:www\.)?firstcry\.com\/[^\s\]}\)>\n\r]*/gi,
            "realme.com":
                /https?:\/\/(?:www\.)?realme\.com\/[^\s\]}\)>\n\r]*/gi,
            "mi.com": /https?:\/\/(?:www\.)?mi\.com\/[^\s\]}\)>\n\r]*/gi,
            "vivo.com": /https?:\/\/(?:www\.)?vivo\.com\/[^\s\]}\)>\n\r]*/gi,
            "tinyurl.com":
                /https?:\/\/(?:www\.)?tinyurl\.com\/[^\s\]}\)>\n\r]*/gi,
            "bitl.li": /https?:\/\/(?:www\.)?bitl\.li\/[^\s\]}\)>\n\r]*/gi,
        };

        // EarnKaro supported platforms with improved regex
        this.earnKaroPlatforms = {
            "meesho.com":
                /https?:\/\/(?:www\.)?meesho\.com\/[^\s\]}\)>\n\r]*/gi,
            "paytmmall.com":
                /https?:\/\/(?:www\.)?paytmmall\.com\/[^\s\]}\)>\n\r]*/gi,
            "bigbasket.com":
                /https?:\/\/(?:www\.)?bigbasket\.com\/[^\s\]}\)>\n\r]*/gi,
            "swiggy.com":
                /https?:\/\/(?:www\.)?swiggy\.com\/[^\s\]}\)>\n\r]*/gi,
            "zomato.com":
                /https?:\/\/(?:www\.)?zomato\.com\/[^\s\]}\)>\n\r]*/gi,
            "makemytrip.com":
                /https?:\/\/(?:www\.)?makemytrip\.com\/[^\s\]}\)>\n\r]*/gi,
            "goibibo.com":
                /https?:\/\/(?:www\.)?goibibo\.com\/[^\s\]}\)>\n\r]*/gi,
            "lenskart.com":
                /https?:\/\/(?:www\.)?lenskart\.com\/[^\s\]}\)>\n\r]*/gi,
            "bewakoof.com":
                /https?:\/\/(?:www\.)?bewakoof\.com\/[^\s\]}\)>\n\r]*/gi,
            "pharmeasy.in":
                /https?:\/\/(?:www\.)?pharmeasy\.in\/[^\s\]}\)>\n\r]*/gi,
            "1mg.com": /https?:\/\/(?:www\.)?1mg\.com\/[^\s\]}\)>\n\r]*/gi,
            "netmeds.com":
                /https?:\/\/(?:www\.)?netmeds\.com\/[^\s\]}\)>\n\r]*/gi,
            "shopclues.com":
                /https?:\/\/(?:www\.)?shopclues\.com\/[^\s\]}\)>\n\r]*/gi,
        };

        conversionLog("✅ Platforms initialized successfully");
        conversionLog(
            `📊 EarnPe platforms: ${Object.keys(this.earnPePlatforms).length}`,
        );
        conversionLog(
            `📊 EarnKaro platforms: ${Object.keys(this.earnKaroPlatforms).length}`,
        );
    }

    // Amazon link conversion with aggressive parameter removal
    convertAmazonLinks(text) {
        if (!this.config.AMAZON_TAG) {
            conversionLog(
                "⚠️ Amazon tag not configured - skipping Amazon conversion",
            );
            return text;
        }

        if (!text) {
            conversionLog("⚠️ No text provided for Amazon conversion");
            return text;
        }

        conversionLog(
            `🎯 Starting Amazon conversion with tag: ${this.config.AMAZON_TAG}`,
        );

        // Comprehensive Amazon regex for all domains including shortened URLs
        const amazonRegex =
            /https?:\/\/(?:www\.)?(?:amazon\.(?:in|com|co\.uk|de|fr|it|es|co\.jp|ca|com\.au|com\.mx|com\.br|ae|sa|sg|com\.tr)|amzn\.to)\/[^\s\]}\)>\n\r]*/gi;
        const amazonMatches = text.match(amazonRegex);

        if (!amazonMatches) {
            conversionLog("📝 No Amazon links found");
            return text;
        }

        conversionLog(
            `🔍 Found ${amazonMatches.length} Amazon links to convert`,
        );

        let convertedText = text;

        convertedText = convertedText.replace(amazonRegex, (url) => {
            try {
                // Skip if URL already has our affiliate tag
                if (url.includes(`tag=${this.config.AMAZON_TAG}`)) {
                    conversionLog(
                        `⏭️ Amazon URL already has affiliate tag - skipping`,
                    );
                    return url;
                }

                conversionLog(`🔍 Processing Amazon URL: ${url}`);

                // For shortened URLs (amzn.to), we need to expand them first
                if (url.includes("amzn.to")) {
                    conversionLog(`🔗 Detected shortened Amazon URL: ${url}`);
                    // For now, we'll add the tag to the shortened URL
                    // In a production environment, you might want to expand the URL first
                    const separator = url.includes("?") ? "&" : "?";
                    const affiliateUrl = `${url}${separator}tag=${this.config.AMAZON_TAG}`;

                    conversionLog(
                        `✅ Amazon shortened URL conversion successful!`,
                    );
                    conversionLog(`   📥 Original: ${url}`);
                    conversionLog(`   📤 Converted: ${affiliateUrl}`);
                    this.conversionStats.amazon++;
                    this.conversionStats.total++;
                    return affiliateUrl;
                }

                // AGGRESSIVE parameter removal for full URLs
                let cleanUrl = url;

                // Remove ALL tracking parameters
                const paramsToRemove = [
                    "tag",
                    "ref",
                    "linkCode",
                    "camp",
                    "creative",
                    "ascsubtag",
                    "keywords",
                    "qid",
                    "sprefix",
                    "sr",
                    "_encoding",
                    "psc",
                    "refRID",
                    "th",
                    "smid",
                    "linkId",
                    "ref_",
                    "adgrpid",
                    "hvadid",
                    "hvpos",
                    "hvnetw",
                    "hvrand",
                    "hvpone",
                    "hvptwo",
                    "hvqmt",
                    "hvdev",
                    "hvdvcmdl",
                    "hvlocint",
                    "hvlocphy",
                    "hvtargid",
                    "pf_rd_p",
                    "pf_rd_r",
                    "pd_rd_wg",
                    "pd_rd_r",
                    "pd_rd_w",
                    "pf_rd_i",
                    "pf_rd_m",
                    "pf_rd_s",
                    "pf_rd_t",
                    "pd_rd_i",
                    "ie",
                    "nodeId",
                    "store-ref",
                    "dchild",
                    "crid",
                    "language",
                    "rnid",
                    "rh",
                    "sort",
                    "low-price",
                    "high-price",
                    "review-rank",
                    "avg-customer-review",
                ];

                // Remove each parameter
                paramsToRemove.forEach((param) => {
                    cleanUrl = cleanUrl.replace(
                        new RegExp(`[?&]${param}=[^&]*`, "gi"),
                        "",
                    );
                });

                // Clean up URL formatting
                cleanUrl = cleanUrl.replace(/[?&]+$/, ""); // Remove trailing ? or &
                cleanUrl = cleanUrl.replace(/[?&]{2,}/g, "&"); // Replace multiple ?& with single &
                cleanUrl = cleanUrl.replace(/\?&/, "?"); // Replace ?& with ?

                // Add YOUR affiliate tag
                const separator = cleanUrl.includes("?") ? "&" : "?";
                const affiliateUrl = `${cleanUrl}${separator}tag=${this.config.AMAZON_TAG}`;

                // Verify tag is present
                if (affiliateUrl.includes(`tag=${this.config.AMAZON_TAG}`)) {
                    conversionLog(`✅ Amazon conversion successful!`);
                    conversionLog(`   📥 Original: ${url.substring(0, 50)}...`);
                    conversionLog(
                        `   📤 Converted: ${affiliateUrl.substring(0, 50)}...`,
                    );
                    this.conversionStats.amazon++;
                    this.conversionStats.total++;
                    return affiliateUrl;
                } else {
                    conversionLog(
                        `❌ Tag verification failed for: ${url}`,
                        "ERROR",
                    );
                    return url;
                }
            } catch (error) {
                conversionLog(
                    `❌ Error converting Amazon link: ${error.message}`,
                    "ERROR",
                );
                return url;
            }
        });

        return convertedText;
    }

    // EarnPe platform conversion
    convertEarnPeLinks(text) {
        if (!this.config.EARNPE_ID) {
            conversionLog(
                "📝 EarnPe ID not configured - skipping EarnPe conversion",
            );
            return text;
        }

        if (!text) {
            conversionLog("⚠️ No text provided for EarnPe conversion");
            return text;
        }

        conversionLog(
            `🎯 Starting EarnPe conversion with ID: ${this.config.EARNPE_ID}`,
        );

        let convertedText = text;

        Object.entries(this.earnPePlatforms).forEach(([platform, regex]) => {
            const matches = text.match(regex);
            if (matches) {
                conversionLog(`🔍 Found ${matches.length} ${platform} links`);

                convertedText = convertedText.replace(regex, (url) => {
                    try {
                        // Skip if already converted
                        if (
                            url.includes("affid=") ||
                            url.includes("earnpe") ||
                            url.includes("earnkaro")
                        ) {
                            conversionLog(
                                `⏭️ ${platform} URL already converted - skipping`,
                            );
                            return url;
                        }

                        conversionLog(
                            `🔗 Converting ${platform} URL: ${url.substring(0, 50)}...`,
                        );

                        // Generate platform-specific shortened URL with EarnPe affiliate ID
                        let shortUrl;

                        if (
                            platform === "flipkart.com" ||
                            platform === "fkrt.to"
                        ) {
                            const shortCode = this.generateFlipkartStyleCode();
                            shortUrl = `https://fkrt.io/${shortCode}`;
                        } else if (
                            platform === "myntra.com" ||
                            platform === "mynt.ro"
                        ) {
                            const shortCode = this.generateMyntraStyleCode();
                            shortUrl = `https://mynt.ro/${shortCode}`;
                        } else if (platform === "ajio.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://ajio.io/${shortCode}`;
                        } else if (platform === "nykaa.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://nykaa.io/${shortCode}`;
                        } else if (platform === "boat-lifestyle.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://boat.io/${shortCode}`;
                        } else if (platform === "croma.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://croma.io/${shortCode}`;
                        } else if (platform === "samsung.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://samsung.io/${shortCode}`;
                        } else if (platform === "oneplus.in") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://oneplus.io/${shortCode}`;
                        } else if (platform === "gonoise.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://gonoise.io/${shortCode}`;
                        } else if (platform === "firstcry.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://firstcry.io/${shortCode}`;
                        } else if (platform === "realme.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://realme.io/${shortCode}`;
                        } else if (platform === "mi.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://mi.io/${shortCode}`;
                        } else if (platform === "vivo.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://vivo.io/${shortCode}`;
                        } else {
                            // Generic shortener for other platforms
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://short.io/${shortCode}`;
                        }

                        // Store mapping for backend affiliate connection
                        this.urlMappings = this.urlMappings || new Map();
                        this.urlMappings.set(shortCode, {
                            originalUrl: url,
                            affiliateId: this.config.EARNPE_ID,
                            platform: platform,
                            affiliateNetwork: "earnpe",
                            timestamp: Date.now(),
                        });

                        conversionLog(`✅ ${platform} conversion successful!`);
                        conversionLog(
                            `   📥 Original: ${url.substring(0, 50)}...`,
                        );
                        conversionLog(`   📤 Converted: ${shortUrl}`);
                        this.conversionStats.earnpe++;
                        this.conversionStats.total++;

                        return shortUrl;
                    } catch (error) {
                        conversionLog(
                            `❌ Error converting ${platform} link: ${error.message}`,
                            "ERROR",
                        );
                        return url;
                    }
                });
            }
        });

        return convertedText;
    }

    // EarnKaro platform conversion
    convertEarnKaroLinks(text) {
        if (!this.config.EARNKARO_ID) {
            conversionLog(
                "📝 EarnKaro ID not configured - skipping EarnKaro conversion",
            );
            return text;
        }

        if (!text) {
            conversionLog("⚠️ No text provided for EarnKaro conversion");
            return text;
        }

        conversionLog(
            `🎯 Starting EarnKaro conversion with ID: ${this.config.EARNKARO_ID}`,
        );

        let convertedText = text;

        Object.entries(this.earnKaroPlatforms).forEach(([platform, regex]) => {
            const matches = text.match(regex);
            if (matches) {
                conversionLog(`🔍 Found ${matches.length} ${platform} links`);

                convertedText = convertedText.replace(regex, (url) => {
                    try {
                        // Skip if already converted
                        if (
                            url.includes("affid=") ||
                            url.includes("earnpe") ||
                            url.includes("earnkaro")
                        ) {
                            conversionLog(
                                `⏭️ ${platform} URL already converted - skipping`,
                            );
                            return url;
                        }

                        conversionLog(
                            `🔗 Converting ${platform} URL: ${url.substring(0, 50)}...`,
                        );

                        // Generate platform-specific shortened URL with EarnKaro affiliate ID
                        let shortUrl;

                        if (platform === "meesho.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://meesho.io/${shortCode}`;
                        } else if (platform === "paytmmall.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://paytm.io/${shortCode}`;
                        } else if (platform === "bigbasket.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://bigbasket.io/${shortCode}`;
                        } else if (platform === "swiggy.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://swiggy.io/${shortCode}`;
                        } else if (platform === "zomato.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://zomato.io/${shortCode}`;
                        } else if (platform === "makemytrip.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://makemytrip.io/${shortCode}`;
                        } else if (platform === "goibibo.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://goibibo.io/${shortCode}`;
                        } else if (platform === "lenskart.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://lenskart.io/${shortCode}`;
                        } else if (platform === "bewakoof.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://bewakoof.io/${shortCode}`;
                        } else if (platform === "pharmeasy.in") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://pharmeasy.io/${shortCode}`;
                        } else if (platform === "1mg.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://1mg.io/${shortCode}`;
                        } else if (platform === "netmeds.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://netmeds.io/${shortCode}`;
                        } else if (platform === "shopclues.com") {
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://shopclues.io/${shortCode}`;
                        } else {
                            // Generic shortener for other platforms
                            const shortCode = this.generateShortCode();
                            shortUrl = `https://short.io/${shortCode}`;
                        }

                        // Store mapping for backend affiliate connection
                        this.urlMappings = this.urlMappings || new Map();
                        this.urlMappings.set(shortCode, {
                            originalUrl: url,
                            affiliateId: this.config.EARNKARO_ID,
                            platform: platform,
                            affiliateNetwork: "earnkaro",
                            timestamp: Date.now(),
                        });

                        conversionLog(`✅ ${platform} conversion successful!`);
                        conversionLog(
                            `   📥 Original: ${url.substring(0, 50)}...`,
                        );
                        conversionLog(`   📤 Converted: ${shortUrl}`);
                        this.conversionStats.earnkaro++;
                        this.conversionStats.total++;

                        return shortUrl;
                    } catch (error) {
                        conversionLog(
                            `❌ Error converting ${platform} link: ${error.message}`,
                            "ERROR",
                        );
                        return url;
                    }
                });
            }
        });

        return convertedText;
    }

    // Main conversion function
    async convertAllLinks(text) {
        if (!text || typeof text !== "string") {
            conversionLog("⚠️ Invalid text provided for conversion");
            return text || "";
        }

        conversionLog("🚀 Starting comprehensive link conversion...");
        conversionLog(`📝 Original text length: ${text.length} characters`);

        // Reset stats for this conversion
        const startStats = { ...this.conversionStats };

        let convertedText = text;

        // Use universal link converter to catch ALL URLs
        convertedText = await this.convertUniversalLinks(convertedText);

        // Also run the specific converters as backup (these are now sync)
        convertedText = this.convertAmazonLinks(convertedText);
        convertedText = this.convertEarnPeLinks(convertedText);
        convertedText = this.convertEarnKaroLinks(convertedText);

        // Save URL mappings after conversion
        this.saveUrlMappings();

        // Calculate conversion stats
        const conversions = {
            amazon: this.conversionStats.amazon - startStats.amazon,
            earnpe: this.conversionStats.earnpe - startStats.earnpe,
            earnkaro: this.conversionStats.earnkaro - startStats.earnkaro,
            total: this.conversionStats.total - startStats.total,
        };

        conversionLog("📊 Conversion Summary:");
        conversionLog(`   🔗 Amazon links: ${conversions.amazon}`);
        conversionLog(`   💰 EarnPe links: ${conversions.earnpe}`);
        conversionLog(`   🛒 EarnKaro links: ${conversions.earnkaro}`);
        conversionLog(`   📈 Total conversions: ${conversions.total}`);
        conversionLog(
            `   📝 Final text length: ${convertedText.length} characters`,
        );

        if (conversions.total > 0) {
            conversionLog(
                "🎉 Link conversion completed successfully!",
                "SUCCESS",
            );
        } else {
            conversionLog("📝 No links found for conversion");
        }

        return convertedText;
    }

    // Get conversion statistics
    getStats() {
        return {
            ...this.conversionStats,
            platforms: {
                earnpe: Object.keys(this.earnPePlatforms).length,
                earnkaro: Object.keys(this.earnKaroPlatforms).length,
            },
        };
    }

    // Reset statistics
    resetStats() {
        this.conversionStats = {
            amazon: 0,
            earnkaro: 0,
            earnpe: 0,
            total: 0,
        };
        conversionLog("📊 Conversion statistics reset");
    }

    // Universal URL detection and conversion
    async convertUniversalLinks(text) {
        if (!text) {
            conversionLog("⚠️ No text provided for universal conversion");
            return text;
        }

        conversionLog("🌐 Starting universal link conversion...");

        // Comprehensive URL regex that catches ALL URLs
        const universalUrlRegex = /https?:\/\/(?:www\.)?[^\s\]}\)>\n\r]*/gi;
        const allUrls = text.match(universalUrlRegex);

        if (!allUrls) {
            conversionLog("📝 No URLs found for universal conversion");
            return text;
        }

        conversionLog(
            `🔍 Found ${allUrls.length} URLs for universal conversion`,
        );

        let convertedText = text;

        // Process URLs sequentially to avoid rate limiting
        for (const url of allUrls) {
            try {
                conversionLog(`🔍 Processing universal URL: ${url}`);

                // Extract domain from URL
                const domain = this.extractDomain(url);
                conversionLog(`🌐 Extracted domain: ${domain}`);

                let convertedUrl = url;

                // Check if it's an Amazon link (including shortened)
                if (domain.includes("amazon") || domain.includes("amzn.to")) {
                    convertedUrl = await this.convertToAmazonAffiliate(url);
                }
                // Check if it's a Flipkart link (including shortened)
                else if (
                    domain.includes("flipkart") ||
                    domain.includes("fkrt.to")
                ) {
                    // Use EarnPe by default, fallback to EarnKaro
                    const affiliateId =
                        this.config.EARNPE_ID || this.config.EARNKARO_ID;
                    if (affiliateId) {
                        convertedUrl = this.convertFlipkartAffiliateLink(
                            url,
                            affiliateId,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnPe or EarnKaro ID configured for Flipkart",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a Myntra link
                else if (
                    domain.includes("myntra") ||
                    domain.includes("mynt.ro")
                ) {
                    if (this.config.EARNPE_ID) {
                        convertedUrl = this.convertMyntraAffiliateLink(
                            url,
                            this.config.EARNPE_ID,
                        );
                    } else {
                        conversionLog("⚠️ No EarnPe ID configured for Myntra");
                        convertedUrl = url;
                    }
                }
                // Check if it's an Ajio link
                else if (domain.includes("ajio")) {
                    if (this.config.EARNPE_ID) {
                        convertedUrl = this.convertAjioAffiliateLink(
                            url,
                            this.config.EARNPE_ID,
                        );
                    } else {
                        conversionLog("⚠️ No EarnPe ID configured for Ajio");
                        convertedUrl = url;
                    }
                }
                // Check if it's a Tata Cliq link
                else if (domain.includes("tatacliq")) {
                    if (this.config.EARNPE_ID) {
                        convertedUrl = this.convertTataCliqAffiliateLink(
                            url,
                            this.config.EARNPE_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnPe ID configured for Tata Cliq",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a Meesho link
                else if (domain.includes("meesho")) {
                    if (this.config.EARNKARO_ID) {
                        convertedUrl = this.convertMeeshoAffiliateLink(
                            url,
                            this.config.EARNKARO_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnKaro ID configured for Meesho",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a Paytm Mall link
                else if (domain.includes("paytmmall")) {
                    if (this.config.EARNKARO_ID) {
                        convertedUrl = this.convertPaytmMallAffiliateLink(
                            url,
                            this.config.EARNKARO_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnKaro ID configured for Paytm Mall",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a BigBasket link
                else if (domain.includes("bigbasket")) {
                    if (this.config.EARNKARO_ID) {
                        convertedUrl = this.convertBigBasketAffiliateLink(
                            url,
                            this.config.EARNKARO_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnKaro ID configured for BigBasket",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a Swiggy link
                else if (domain.includes("swiggy")) {
                    if (this.config.EARNKARO_ID) {
                        convertedUrl = this.convertSwiggyAffiliateLink(
                            url,
                            this.config.EARNKARO_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnKaro ID configured for Swiggy",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's a Zomato link
                else if (domain.includes("zomato")) {
                    if (this.config.EARNKARO_ID) {
                        convertedUrl = this.convertZomatoAffiliateLink(
                            url,
                            this.config.EARNKARO_ID,
                        );
                    } else {
                        conversionLog(
                            "⚠️ No EarnKaro ID configured for Zomato",
                        );
                        convertedUrl = url;
                    }
                }
                // Check if it's an EarnPe platform
                else if (this.isEarnPePlatform(domain)) {
                    convertedUrl = await this.convertToEarnPe(url);
                }
                // Check if it's an EarnKaro platform
                else if (this.isEarnKaroPlatform(domain)) {
                    convertedUrl = await this.convertToEarnKaro(url);
                }
                // For unknown domains, try to determine based on common patterns
                else if (this.isLikelyEarnPeDomain(domain)) {
                    conversionLog(
                        `🎯 Likely EarnPe domain detected: ${domain}`,
                    );
                    convertedUrl = await this.convertToEarnPe(url);
                } else if (this.isLikelyEarnKaroDomain(domain)) {
                    conversionLog(
                        `🎯 Likely EarnKaro domain detected: ${domain}`,
                    );
                    convertedUrl = await this.convertToEarnKaro(url);
                } else {
                    // If we can't determine, log it for manual review
                    conversionLog(
                        `❓ Unknown domain: ${domain} - URL: ${url}`,
                        "WARNING",
                    );
                }

                // Replace the URL in the text
                convertedText = convertedText.replace(url, convertedUrl);
            } catch (error) {
                conversionLog(
                    `❌ Error converting universal URL: ${error.message}`,
                    "ERROR",
                );
            }
        }

        return convertedText;
    }

    // Extract domain from URL
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase();
        } catch (error) {
            // Fallback for malformed URLs
            const match = url.match(/https?:\/\/(?:www\.)?([^\/\s]+)/i);
            return match ? match[1].toLowerCase() : "";
        }
    }

    // Helper method to identify EarnPe platforms
    isEarnPePlatform(domain) {
        const earnPePlatforms = [
            "flipkart",
            "myntra",
            "ajio",
            "tatacliq",
            "nykaa",
            "purplle",
            "firstcry",
            "shopclues",
            "snapdeal",
            "limeroad",
            "koovs",
        ];
        return earnPePlatforms.some((platform) => domain.includes(platform));
    }

    // Helper method to identify EarnKaro platforms
    isEarnKaroPlatform(domain) {
        const earnKaroPlatforms = [
            "meesho",
            "paytmmall",
            "bigbasket",
            "swiggy",
            "zomato",
            "dunzo",
            "grofers",
            "blinkit",
            "zepto",
            "rapido",
            "ola",
        ];
        return earnKaroPlatforms.some((platform) => domain.includes(platform));
    }

    // Helper method to identify likely EarnPe domains
    isLikelyEarnPeDomain(domain) {
        const earnPeKeywords = [
            "fashion",
            "clothing",
            "beauty",
            "cosmetics",
            "apparel",
        ];
        return earnPeKeywords.some((keyword) => domain.includes(keyword));
    }

    // Helper method to identify likely EarnKaro domains
    isLikelyEarnKaroDomain(domain) {
        const earnKaroKeywords = [
            "food",
            "grocery",
            "delivery",
            "transport",
            "travel",
        ];
        return earnKaroKeywords.some((keyword) => domain.includes(keyword));
    }

    // Convert URL to Amazon affiliate with shortening
    async convertToAmazonAffiliate(url) {
        if (!this.config.AMAZON_TAG) {
            conversionLog("⚠️ Amazon tag not configured");
            return url;
        }

        try {
            // If it's already a shortened URL, add affiliate tag and ensure it goes to correct region
            if (url.includes("amzn.to")) {
                const separator = url.includes("?") ? "&" : "?";
                // Add affiliate tag and parameters for the detected region
                const affiliateUrl = `${url}${separator}tag=${this.config.AMAZON_TAG}&ref_=as_li_ss_tl&linkCode=ogi`;
                conversionLog(`✅ Amazon shortened URL: ${affiliateUrl}`);
                this.conversionStats.amazon++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Detect Amazon region and convert accordingly
            let processedUrl = url;
            const detectedRegion = this.detectAmazonRegion(url);

            if (detectedRegion === "india") {
                // Ensure it's amazon.in for Indian users
                if (url.includes("amazon.com") && !url.includes("amazon.in")) {
                    processedUrl = url.replace("amazon.com", "amazon.in");
                    conversionLog(
                        `🔄 Converted amazon.com to amazon.in for Indian region: ${processedUrl}`,
                    );
                }
                // Add Indian locale parameters
                const separator = processedUrl.includes("?") ? "&" : "?";
                const affiliateUrl = `${processedUrl}${separator}tag=${this.config.AMAZON_TAG}&ref_=as_li_ss_tl&linkCode=ogi&language=en_IN`;
                conversionLog(
                    `🔗 Generated Amazon.in affiliate URL: ${affiliateUrl}`,
                );

                // Store the mapping for reference
                this.urlMappings = this.urlMappings || new Map();
                const shortCode = this.generateShortCode();
                this.urlMappings.set(shortCode, {
                    originalUrl: url,
                    affiliateUrl: affiliateUrl,
                    affiliateId: this.config.AMAZON_TAG,
                    platform: "amazon",
                    affiliateNetwork: "amazon",
                    region: "india",
                    timestamp: Date.now(),
                });

                this.conversionStats.amazon++;
                this.conversionStats.total++;
                return affiliateUrl;
            } else {
                // For global users, ensure it's amazon.com
                if (url.includes("amazon.in") && !url.includes("amazon.com")) {
                    processedUrl = url.replace("amazon.in", "amazon.com");
                    conversionLog(
                        `🔄 Converted amazon.in to amazon.com for global region: ${processedUrl}`,
                    );
                }
                // Add global parameters
                const separator = processedUrl.includes("?") ? "&" : "?";
                const affiliateUrl = `${processedUrl}${separator}tag=${this.config.AMAZON_TAG}&ref_=as_li_ss_tl&linkCode=ogi`;
                conversionLog(
                    `🔗 Generated Amazon.com affiliate URL: ${affiliateUrl}`,
                );

                // Store the mapping for reference
                this.urlMappings = this.urlMappings || new Map();
                const shortCode = this.generateShortCode();
                this.urlMappings.set(shortCode, {
                    originalUrl: url,
                    affiliateUrl: affiliateUrl,
                    affiliateId: this.config.AMAZON_TAG,
                    platform: "amazon",
                    affiliateNetwork: "amazon",
                    region: "global",
                    timestamp: Date.now(),
                });

                this.conversionStats.amazon++;
                this.conversionStats.total++;
                return affiliateUrl;
            }
        } catch (error) {
            conversionLog(
                `❌ Error converting Amazon URL: ${error.message}`,
                "ERROR",
            );
            return url;
        }
    }

    // Detect Amazon region based on URL and configuration
    detectAmazonRegion(url) {
        // Check if URL explicitly contains amazon.in
        if (url.includes("amazon.in")) {
            conversionLog(`🌍 Detected Indian Amazon URL: ${url}`);
            return "india";
        }

        // Check if URL explicitly contains amazon.com
        if (url.includes("amazon.com")) {
            conversionLog(`🌍 Detected Global Amazon URL: ${url}`);
            return "global";
        }

        // Check if URL contains other Amazon domains
        if (url.includes("amazon.co.uk")) {
            conversionLog(`🌍 Detected UK Amazon URL: ${url}`);
            return "global";
        }
        if (url.includes("amazon.de")) {
            conversionLog(`🌍 Detected German Amazon URL: ${url}`);
            return "global";
        }
        if (url.includes("amazon.fr")) {
            conversionLog(`🌍 Detected French Amazon URL: ${url}`);
            return "global";
        }
        if (url.includes("amazon.ca")) {
            conversionLog(`🌍 Detected Canadian Amazon URL: ${url}`);
            return "global";
        }
        if (url.includes("amazon.com.au")) {
            conversionLog(`🌍 Detected Australian Amazon URL: ${url}`);
            return "global";
        }
        if (url.includes("amazon.co.jp")) {
            conversionLog(`🌍 Detected Japanese Amazon URL: ${url}`);
            return "global";
        }

        // For amzn.to links, check configuration or default to India
        if (url.includes("amzn.to")) {
            // You can add logic here to detect region based on your bot's target audience
            // For now, defaulting to India since your bot seems to be for Indian market
            conversionLog(
                `🌍 Detected amzn.to URL, defaulting to India: ${url}`,
            );
            return "india";
        }

        // Default to India for unknown URLs (assuming Indian market)
        conversionLog(`🌍 Unknown Amazon URL, defaulting to India: ${url}`);
        return "india";
    }

    // Convert URL to EarnPe with shortening
    async convertToEarnPe(url) {
        if (!this.config.EARNPE_ID) {
            conversionLog("⚠️ EarnPe ID not configured");
            return url;
        }

        try {
            // Generate platform-specific shortened URLs
            const domain = this.extractDomain(url);

            // Flipkart - use proper deep linking format
            if (domain.includes("flipkart") || domain.includes("fkrt.to")) {
                const affiliateUrl = this.convertFlipkartAffiliateLink(
                    url,
                    this.config.EARNPE_ID,
                );
                conversionLog(
                    `✅ Flipkart conversion: ${url} → ${affiliateUrl}`,
                );
                this.conversionStats.earnpe++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Myntra - use proper deep linking format
            if (domain.includes("myntra") || domain.includes("mynt.ro")) {
                const affiliateUrl = this.convertMyntraAffiliateLink(
                    url,
                    this.config.EARNPE_ID,
                );
                conversionLog(`✅ Myntra conversion: ${url} → ${affiliateUrl}`);
                this.conversionStats.earnpe++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Ajio - use proper deep linking format
            if (domain.includes("ajio")) {
                const affiliateUrl = this.convertAjioAffiliateLink(
                    url,
                    this.config.EARNPE_ID,
                );
                conversionLog(`✅ Ajio conversion: ${url} → ${affiliateUrl}`);
                this.conversionStats.earnpe++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Tata Cliq - use proper deep linking format
            if (domain.includes("tatacliq")) {
                const affiliateUrl = this.convertTataCliqAffiliateLink(
                    url,
                    this.config.EARNPE_ID,
                );
                conversionLog(
                    `✅ Tata Cliq conversion: ${url} → ${affiliateUrl}`,
                );
                this.conversionStats.earnpe++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // For other EarnPe platforms, generate shortened URLs (already connected to EarnPe in backend)
            const shortUrl = await this.shortenGenericUrl(url, "earnpe");
            conversionLog(`✅ Generic EarnPe conversion: ${url} → ${shortUrl}`);
            this.conversionStats.earnpe++;
            this.conversionStats.total++;
            return shortUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting to EarnPe: ${error.message}`,
                "ERROR",
            );
            return url;
        }
    }

    // Convert URL to EarnKaro with shortening
    async convertToEarnKaro(url) {
        if (!this.config.EARNKARO_ID) {
            conversionLog("⚠️ EarnKaro ID not configured");
            return url;
        }

        try {
            const domain = this.extractDomain(url);

            // Meesho - use proper deep linking format
            if (domain.includes("meesho")) {
                const affiliateUrl = this.convertMeeshoAffiliateLink(
                    url,
                    this.config.EARNKARO_ID,
                );
                conversionLog(`✅ Meesho conversion: ${url} → ${affiliateUrl}`);
                this.conversionStats.earnkaro++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Paytm Mall - use proper deep linking format
            if (domain.includes("paytmmall")) {
                const affiliateUrl = this.convertPaytmMallAffiliateLink(
                    url,
                    this.config.EARNKARO_ID,
                );
                conversionLog(
                    `✅ Paytm Mall conversion: ${url} → ${affiliateUrl}`,
                );
                this.conversionStats.earnkaro++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // BigBasket - use proper deep linking format
            if (domain.includes("bigbasket")) {
                const affiliateUrl = this.convertBigBasketAffiliateLink(
                    url,
                    this.config.EARNKARO_ID,
                );
                conversionLog(
                    `✅ BigBasket conversion: ${url} → ${affiliateUrl}`,
                );
                this.conversionStats.earnkaro++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Swiggy - use proper deep linking format
            if (domain.includes("swiggy")) {
                const affiliateUrl = this.convertSwiggyAffiliateLink(
                    url,
                    this.config.EARNKARO_ID,
                );
                conversionLog(`✅ Swiggy conversion: ${url} → ${affiliateUrl}`);
                this.conversionStats.earnkaro++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // Zomato - use proper deep linking format
            if (domain.includes("zomato")) {
                const affiliateUrl = this.convertZomatoAffiliateLink(
                    url,
                    this.config.EARNKARO_ID,
                );
                conversionLog(`✅ Zomato conversion: ${url} → ${affiliateUrl}`);
                this.conversionStats.earnkaro++;
                this.conversionStats.total++;
                return affiliateUrl;
            }

            // For other EarnKaro platforms, generate shortened URLs (already connected to EarnKaro in backend)
            const shortUrl = await this.shortenGenericUrl(url, "earnkaro");
            conversionLog(
                `✅ Generic EarnKaro conversion: ${url} → ${shortUrl}`,
            );
            this.conversionStats.earnkaro++;
            this.conversionStats.total++;
            return shortUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting to EarnKaro: ${error.message}`,
                "ERROR",
            );
            return url;
        }
    }

    // Convert Flipkart link to affiliate link using long URL format
    convertFlipkartAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(
                `🔗 Generated Flipkart affiliate URL: ${affiliateUrl}`,
            );

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "flipkart",
                affiliateNetwork: "earnpe",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Flipkart affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Myntra link to affiliate link using long URL format
    convertMyntraAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(`🔗 Generated Myntra affiliate URL: ${affiliateUrl}`);

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "myntra",
                affiliateNetwork: "earnpe",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Myntra affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Ajio link to affiliate link using long URL format
    convertAjioAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(`🔗 Generated Ajio affiliate URL: ${affiliateUrl}`);

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "ajio",
                affiliateNetwork: "earnpe",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Ajio affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Tata Cliq link to affiliate link using long URL format
    convertTataCliqAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(
                `🔗 Generated Tata Cliq affiliate URL: ${affiliateUrl}`,
            );

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "tatacliq",
                affiliateNetwork: "earnpe",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Tata Cliq affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Meesho link to affiliate link using long URL format
    convertMeeshoAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(`🔗 Generated Meesho affiliate URL: ${affiliateUrl}`);

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "meesho",
                affiliateNetwork: "earnkaro",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Meesho affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Paytm Mall link to affiliate link using long URL format
    convertPaytmMallAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(
                `🔗 Generated Paytm Mall affiliate URL: ${affiliateUrl}`,
            );

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "paytmmall",
                affiliateNetwork: "earnkaro",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Paytm Mall affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert BigBasket link to affiliate link using long URL format
    convertBigBasketAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(
                `🔗 Generated BigBasket affiliate URL: ${affiliateUrl}`,
            );

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "bigbasket",
                affiliateNetwork: "earnkaro",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting BigBasket affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Swiggy link to affiliate link using long URL format
    convertSwiggyAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(`🔗 Generated Swiggy affiliate URL: ${affiliateUrl}`);

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "swiggy",
                affiliateNetwork: "earnkaro",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Swiggy affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert Zomato link to affiliate link using long URL format
    convertZomatoAffiliateLink(originalUrl, affiliateId) {
        try {
            // Add affiliate ID as query parameter to the original URL
            const separator = originalUrl.includes("?") ? "&" : "?";
            const affiliateUrl = `${originalUrl}${separator}affid=${affiliateId}`;

            conversionLog(`🔗 Generated Zomato affiliate URL: ${affiliateUrl}`);

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: originalUrl,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: "zomato",
                affiliateNetwork: "earnkaro",
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting Zomato affiliate link: ${error.message}`,
                "ERROR",
            );
            return originalUrl;
        }
    }

    // Convert generic URL for EarnPe/EarnKaro using long URL format
    async shortenGenericUrl(url, platform) {
        try {
            // Add affiliate ID as query parameter to the original URL (long URL format)
            const affiliateId =
                platform === "earnpe"
                    ? this.config.EARNPE_ID
                    : this.config.EARNKARO_ID;
            const separator = url.includes("?") ? "&" : "?";
            const affiliateUrl = `${url}${separator}affid=${affiliateId}`;

            conversionLog(
                `🔗 Generated ${platform} long affiliate URL: ${affiliateUrl}`,
            );

            // Store the mapping for reference
            this.urlMappings = this.urlMappings || new Map();
            const shortCode = this.generateShortCode();
            this.urlMappings.set(shortCode, {
                originalUrl: url,
                affiliateUrl: affiliateUrl,
                affiliateId: affiliateId,
                platform: platform,
                affiliateNetwork: platform,
                timestamp: Date.now(),
            });

            return affiliateUrl;
        } catch (error) {
            conversionLog(
                `❌ Error converting generic URL: ${error.message}`,
                "ERROR",
            );
            return url;
        }
    }

    // Generate short code for URLs (generic)
    generateShortCode() {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Save URL mappings to file for tracking
    saveUrlMappings() {
        try {
            if (!this.urlMappings || this.urlMappings.size === 0) {
                conversionLog("📝 No URL mappings to save");
                return;
            }

            const fs = require("fs");
            const path = require("path");

            const mappings = {};
            for (const [shortCode, data] of this.urlMappings.entries()) {
                mappings[shortCode] = data;
            }

            const mappingsPath = path.join(__dirname, "url_mappings.json");
            fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));

            conversionLog(
                `💾 Saved ${this.urlMappings.size} URL mappings to url_mappings.json`,
            );
        } catch (error) {
            conversionLog(
                `❌ Error saving URL mappings: ${error.message}`,
                "ERROR",
            );
        }
    }

    // Get URL mappings
    getUrlMappings() {
        return this.urlMappings || new Map();
    }

    // Load URL mappings from file
    loadUrlMappings() {
        try {
            const fs = require("fs");
            const path = require("path");

            const mappingsPath = path.join(__dirname, "url_mappings.json");
            if (fs.existsSync(mappingsPath)) {
                const mappingsData = fs.readFileSync(mappingsPath, "utf8");
                const mappings = JSON.parse(mappingsData);

                this.urlMappings = new Map();
                for (const [shortCode, data] of Object.entries(mappings)) {
                    this.urlMappings.set(shortCode, data);
                }

                conversionLog(
                    `📂 Loaded ${this.urlMappings.size} URL mappings from url_mappings.json`,
                );
            }
        } catch (error) {
            conversionLog(
                `❌ Error loading URL mappings: ${error.message}`,
                "ERROR",
            );
        }
    }
}

module.exports = LinkConverter;
