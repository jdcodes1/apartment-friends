import axios from 'axios';
import * as cheerio from 'cheerio';

interface ZillowListingData {
  title?: string;
  description?: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: 'studio' | '1br' | '2br' | '3br' | '4br+';
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  amenities?: string[];
  images?: string[];
  availableDate?: string;
}

export class ZillowParserService {
  /**
   * WARNING: Web scraping Zillow may violate their Terms of Service.
   * This is for educational/personal use only. For production, consider:
   * 1. Using Zillow's official API (Bridge API)
   * 2. Getting explicit permission from Zillow
   * 3. Using a third-party real estate data API
   */

  /**
   * Parse a Zillow listing URL and extract listing data
   */
  async parseZillowListing(url: string): Promise<{ success: boolean; data?: ZillowListingData; error?: string }> {
    try {
      // Validate URL is from Zillow
      if (!this.isValidZillowUrl(url)) {
        return {
          success: false,
          error: 'Invalid Zillow URL. Please provide a valid Zillow listing URL.'
        };
      }

      // Fetch the page
      const html = await this.fetchPage(url);
      if (!html) {
        return {
          success: false,
          error: 'Failed to fetch Zillow page. The listing may not exist or be unavailable.'
        };
      }

      // Parse the HTML
      const data = this.extractListingData(html);

      if (!data.address && !data.title) {
        return {
          success: false,
          error: 'Could not extract listing data. The page structure may have changed.'
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      console.error('Zillow parsing error:', error);
      return {
        success: false,
        error: 'An error occurred while parsing the Zillow listing.'
      };
    }
  }

  /**
   * Validate that the URL is a Zillow listing URL
   */
  private isValidZillowUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        (urlObj.hostname === 'www.zillow.com' || urlObj.hostname === 'zillow.com') &&
        (urlObj.pathname.includes('/homedetails/') || urlObj.pathname.includes('/b/'))
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetch the HTML content of a Zillow page
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Zillow page:', error.message);
      return null;
    }
  }

  /**
   * Extract listing data from HTML
   * Note: This is fragile and will break if Zillow changes their HTML structure
   */
  private extractListingData(html: string): ZillowListingData {
    const $ = cheerio.load(html);
    const data: ZillowListingData = {};

    try {
      // Try to find JSON-LD structured data first (most reliable)
      const scriptTags = $('script[type="application/ld+json"]');
      scriptTags.each((i, elem) => {
        try {
          const jsonData = JSON.parse($(elem).html() || '{}');
          if (jsonData['@type'] === 'SingleFamilyResidence' || jsonData['@type'] === 'Apartment') {
            data.address = jsonData.address?.streetAddress;
            data.city = jsonData.address?.addressLocality;
            data.state = jsonData.address?.addressRegion;
            data.zipCode = jsonData.address?.postalCode;

            // Extract price
            if (jsonData.offers?.price) {
              data.price = parseInt(jsonData.offers.price);
            }

            // Extract bedrooms/bathrooms
            if (jsonData.numberOfRooms) {
              data.bedrooms = parseInt(jsonData.numberOfRooms);
            }
          }
        } catch (e) {
          // Continue to next script tag
        }
      });

      // Extract title
      const titleSelectors = [
        'h1[data-testid="summary-header"]',
        'h1.summary-header',
        'h1',
        'title'
      ];

      for (const selector of titleSelectors) {
        const title = $(selector).first().text().trim();
        if (title && title.length > 0 && !title.includes('Zillow:')) {
          data.title = title;
          break;
        }
      }

      // Extract price if not found in JSON-LD
      if (!data.price) {
        const priceSelectors = [
          '[data-testid="price"]',
          '.summary-price',
          'span[data-test="property-card-price"]'
        ];

        for (const selector of priceSelectors) {
          const priceText = $(selector).first().text().trim();
          const priceMatch = priceText.match(/\$([0-9,]+)/);
          if (priceMatch) {
            data.price = parseInt(priceMatch[1].replace(/,/g, ''));
            break;
          }
        }
      }

      // Extract address if not found in JSON-LD
      if (!data.address) {
        const addressSelectors = [
          '[data-testid="summary-address"]',
          'h1.address',
          '.summary-address'
        ];

        for (const selector of addressSelectors) {
          const addressText = $(selector).first().text().trim();
          if (addressText) {
            const parts = addressText.split(',');
            if (parts.length >= 2) {
              data.address = parts[0].trim();
              const cityState = parts[1].trim().split(' ');
              if (cityState.length >= 2) {
                data.city = cityState.slice(0, -1).join(' ');
                data.state = cityState[cityState.length - 1];
              }
              if (parts.length >= 3) {
                data.zipCode = parts[2].trim();
              }
            }
            break;
          }
        }
      }

      // Extract bedrooms and bathrooms
      const bedsSelectors = [
        '[data-testid="bed-bath-beyond"] span:first-child',
        '.fact-beds',
        'span:contains("bd")'
      ];

      for (const selector of bedsSelectors) {
        const bedsText = $(selector).first().text().trim();
        const bedsMatch = bedsText.match(/(\d+)/);
        if (bedsMatch) {
          data.bedrooms = parseInt(bedsMatch[1]);
          break;
        }
      }

      const bathsSelectors = [
        '[data-testid="bed-bath-beyond"] span:nth-child(2)',
        '.fact-baths',
        'span:contains("ba")'
      ];

      for (const selector of bathsSelectors) {
        const bathsText = $(selector).first().text().trim();
        const bathsMatch = bathsText.match(/([0-9.]+)/);
        if (bathsMatch) {
          data.bathrooms = parseFloat(bathsMatch[1]);
          break;
        }
      }

      // Extract square footage
      const sqftSelectors = [
        '[data-testid="bed-bath-beyond"] span:contains("sqft")',
        '.fact-sqft',
        'span:contains("sqft")'
      ];

      for (const selector of sqftSelectors) {
        const sqftText = $(selector).text().trim();
        const sqftMatch = sqftText.match(/([0-9,]+)\s*sqft/i);
        if (sqftMatch) {
          data.squareFeet = parseInt(sqftMatch[1].replace(/,/g, ''));
          break;
        }
      }

      // Determine property type based on bedrooms
      if (data.bedrooms !== undefined) {
        if (data.bedrooms === 0) {
          data.propertyType = 'studio';
        } else if (data.bedrooms === 1) {
          data.propertyType = '1br';
        } else if (data.bedrooms === 2) {
          data.propertyType = '2br';
        } else if (data.bedrooms === 3) {
          data.propertyType = '3br';
        } else {
          data.propertyType = '4br+';
        }
      }

      // Extract description
      const descriptionSelectors = [
        '[data-testid="description-text"]',
        '.description-text',
        '.home-description'
      ];

      for (const selector of descriptionSelectors) {
        const description = $(selector).first().text().trim();
        if (description && description.length > 0) {
          data.description = description;
          break;
        }
      }

      // Extract images
      const images: string[] = [];
      $('img').each((i, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src && (src.includes('photos.zillowstatic.com') || src.includes('ssl.cdn-redfin.com'))) {
          // Only get high-res images
          if (!src.includes('thumbnail') && !images.includes(src)) {
            images.push(src);
          }
        }
      });

      if (images.length > 0) {
        data.images = images.slice(0, 10); // Limit to 10 images
      }

      // Extract amenities (this is tricky and may not work well)
      const amenities: string[] = [];
      $('[data-testid="amenities"] li, .amenities-list li').each((i, elem) => {
        const amenity = $(elem).text().trim();
        if (amenity && amenity.length > 0) {
          amenities.push(amenity);
        }
      });

      if (amenities.length > 0) {
        data.amenities = amenities;
      }

    } catch (error) {
      console.error('Error extracting data from HTML:', error);
    }

    return data;
  }

  /**
   * Convert Zillow data to our listing format
   */
  convertToListingFormat(zillowData: ZillowListingData, zillowUrl: string): any {
    const listing: any = {
      zillow_url: zillowUrl
    };

    if (zillowData.title) {
      listing.title = zillowData.title.substring(0, 100); // Max 100 chars
    }

    if (zillowData.description) {
      listing.description = zillowData.description.substring(0, 2000); // Max 2000 chars
    }

    if (zillowData.price) {
      listing.price = zillowData.price;
    }

    if (zillowData.address) {
      listing.address = zillowData.address;
    }

    if (zillowData.city) {
      listing.city = zillowData.city;
    }

    if (zillowData.state) {
      listing.state = zillowData.state;
    }

    if (zillowData.zipCode) {
      listing.zip_code = zillowData.zipCode;
    }

    if (zillowData.propertyType) {
      listing.property_type = zillowData.propertyType;
    }

    if (zillowData.amenities && zillowData.amenities.length > 0) {
      listing.amenities = zillowData.amenities;
    }

    if (zillowData.images && zillowData.images.length > 0) {
      // Note: These are URLs, not base64. You may want to fetch and convert them
      listing.image_urls = zillowData.images;
    }

    // Store bedroom/bathroom info in room_details if available
    if (zillowData.bedrooms !== undefined || zillowData.bathrooms !== undefined || zillowData.squareFeet !== undefined) {
      listing.room_details = {
        bedrooms: zillowData.bedrooms,
        bathrooms: zillowData.bathrooms,
        square_feet: zillowData.squareFeet
      };
    }

    return listing;
  }
}
