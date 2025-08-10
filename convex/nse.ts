"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Manual trigger for testing
export const manualFetchNseData = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; count?: number; errors?: number; total?: number; error?: string }> => {
    return await ctx.runAction(internal.nse.fetchNseData, {});
  },
});


export const fetchNseData = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Starting NSE data fetch with proper session flow...");
      
      // Step 1: Visit NSE India homepage first to establish initial session
      console.log("Step 1: Visiting NSE India homepage...");
      const homepageResponse = await fetch("https://www.nseindia.com", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
        },
      });

      console.log(`Homepage response status: ${homepageResponse.status}`);
      
      // Extract cookies from homepage
      let cookieString = "";
      const homepageSetCookie = homepageResponse.headers.get("set-cookie");
      if (homepageSetCookie) {
        cookieString = homepageSetCookie
          .split(",")
          .map(cookie => cookie.split(";")[0].trim())
          .join("; ");
        console.log("Extracted cookies from homepage:", cookieString.substring(0, 100) + "...");
      }

      // Step 2: Wait and then visit the market data IPO page to establish proper context
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Step 2: Visiting market data IPO page...");
      const marketDataResponse = await fetch("https://www.nseindia.com/market-data/all-upcoming-issues-ipo", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
          "Referer": "https://www.nseindia.com",
          "Cache-Control": "max-age=0",
          ...(cookieString && { "Cookie": cookieString }),
        },
      });

      console.log(`Market data page response status: ${marketDataResponse.status}`);
      
      // Update cookies with any new ones from market data page
      const marketDataSetCookie = marketDataResponse.headers.get("set-cookie");
      if (marketDataSetCookie) {
        const newCookies = marketDataSetCookie
          .split(",")
          .map(cookie => cookie.split(";")[0].trim())
          .join("; ");
        cookieString = cookieString ? `${cookieString}; ${newCookies}` : newCookies;
        console.log("Updated cookies with market data page cookies");
      }

      // Step 3: Wait again and then call the API with all established context
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log("Step 3: Calling the IPO API...");
      const apiResponse = await fetch("https://www.nseindia.com/api/all-upcoming-issues?category=ipo", {
        method: "GET",
        headers: {
          "Referer": "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "X-Requested-With": "XMLHttpRequest",
          "DNT": "1",
          "Connection": "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          ...(cookieString && { "Cookie": cookieString }),
        },
      });

      console.log(`API response status: ${apiResponse.status}`);

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`API fetch failed with status ${apiResponse.status}:`, errorBody.substring(0, 500));
        
        // If we get 403, try with different approach
        if (apiResponse.status === 403) {
          console.log("Got 403, trying alternative approach...");
          
          // Wait longer and try again with minimal headers
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const retryResponse = await fetch("https://www.nseindia.com/api/all-upcoming-issues?category=ipo", {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
              "Accept": "*/*",
              ...(cookieString && { "Cookie": cookieString }),
            },
          });
          
          console.log(`Retry response status: ${retryResponse.status}`);
          
          if (!retryResponse.ok) {
            throw new Error(`Both attempts failed. Last status: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          console.log("Retry successful, processing data...");
          
          // Process retry data
          const retryIpoList = retryData.data || retryData;
          return await processIpoData(ctx, retryIpoList);
        } else {
          throw new Error(`HTTP error! status: ${apiResponse.status}, body: ${errorBody.substring(0, 500)}`);
        }
      }

      const data = await apiResponse.json();
      console.log("API response received successfully, parsing data...");
      
      // The response structure might be different, let's handle both cases
      const ipoList = data.data || data;
      return await processIpoData(ctx, ipoList);

    } catch (error) {
      console.error("Failed to fetch NSE data:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        count: 0 
      };
    }
  },
});

// Helper function to clean and validate string data
function cleanStringData(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Convert to string and remove surrounding double quotes
  let cleaned = String(value);
  
  // Remove surrounding double quotes if they exist
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove any additional escaping
  cleaned = cleaned.replace(/\\"/g, '"');
  
  return cleaned.trim();
}

// Helper function to process IPO data
async function processIpoData(ctx: any, ipoList: any) {
  if (!Array.isArray(ipoList)) {
    console.error("Expected array but got:", typeof ipoList, ipoList);
    throw new Error(`Expected array of IPOs but received: ${typeof ipoList}`);
  }

  console.log(`Processing ${ipoList.length} IPOs...`);
  let successCount = 0;
  let errorCount = 0;

  if (Array.isArray(ipoList) && ipoList.length > 0) {
    for (const ipoData of ipoList) {
      try {
        // Validate required fields
        if (!ipoData.symbol || !ipoData.companyName) {
          console.warn("Skipping IPO with missing required fields:", ipoData);
          errorCount++;
          continue;
        }

        // Process and clean the data with validation layer
        const processedData = {
          symbol: cleanStringData(ipoData.symbol),
          companyName: cleanStringData(ipoData.companyName),
          series: (cleanStringData(ipoData.series) || "EQ") as "EQ" | "SME",
          issueStartDate: cleanStringData(ipoData.issueStartDate),
          issueEndDate: cleanStringData(ipoData.issueEndDate),
          status: cleanStringData(ipoData.status) || "Unknown",
          issueSize: cleanStringData(ipoData.issueSize),
          issuePrice: cleanStringData(ipoData.issuePrice),
          sr_no: typeof ipoData.sr_no === 'string' ? parseInt(cleanStringData(ipoData.sr_no), 10) : (ipoData.sr_no || 0),
          isBse: ipoData.isBse,
          // Process lotSize - clean string and convert to number, handle various formats
          lotSize: ipoData.lotSize ? (() => {
            const cleanedLotSize = cleanStringData(ipoData.lotSize);
            const lotSizeStr = cleanedLotSize.replace(/[^0-9]/g, ''); // Remove non-numeric characters
            const lotSizeNum = parseInt(lotSizeStr, 10);
            return isNaN(lotSizeNum) ? undefined : lotSizeNum;
          })() : undefined,
        };

        // Validate required fields after cleaning
        if (!processedData.symbol || !processedData.companyName || 
            processedData.symbol === '""' || processedData.companyName === '""') {
          console.warn("Skipping IPO with invalid cleaned data:", processedData);
          errorCount++;
          continue;
        }

        console.log(`Processing IPO: ${processedData.symbol} - LotSize: ${processedData.lotSize || 'not set'} - Series: ${processedData.series} - Status: ${processedData.status}`);        await ctx.runMutation(internal.ipos.upsertIpo, processedData);
        successCount++;
      } catch (mutationError) {
        console.error("Error upserting IPO:", ipoData.symbol, mutationError);
        console.error("IPO data that failed:", JSON.stringify(ipoData, null, 2));
        errorCount++;
      }
    }
  }
  
  console.log(`NSE data fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
  return { 
    success: true, 
    count: successCount,
    errors: errorCount,
    total: Array.isArray(ipoList) ? ipoList.length : 0 
  };
}
