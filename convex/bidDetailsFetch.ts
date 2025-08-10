"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Manual trigger for testing bid details fetch
export const manualFetchBidDetails = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; count?: number; errors?: number; error?: string }> => {
    return await ctx.runAction(internal.bidDetailsFetch.fetchAllBidDetails, {});
  },
});

export const fetchAllBidDetails = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Starting bid details fetch for all mainboard IPOs...");
      
      // Get all mainboard (EQ series) IPOs from the database
      const mainboardIpos = await ctx.runQuery(internal.ipos.listIpos, {
        series: "EQ"
      });

      if (!mainboardIpos || mainboardIpos.length === 0) {
        console.log("No mainboard IPOs found to fetch bid details for");
        return { success: true, count: 0, errors: 0 };
      }

      console.log(`Found ${mainboardIpos.length} mainboard IPOs to process`);
      
      let successCount = 0;
      let errorCount = 0;

      // Process each mainboard IPO
      for (const ipo of mainboardIpos) {
        try {
          console.log(`Processing bid details for IPO: ${ipo.symbol} - ${ipo.companyName}`);
          
          const result = await fetchBidDetailsForSymbol(ctx, ipo.symbol, ipo.companyName, ipo.status);
          
          if (result.success) {
            successCount++;
            console.log(`Successfully processed ${result.count} bid categories for ${ipo.symbol}`);
          } else {
            errorCount++;
            console.error(`Failed to process bid details for ${ipo.symbol}:`, result.error);
          }

          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Error processing IPO ${ipo.symbol}:`, error);
          errorCount++;
        }
      }

      console.log(`Bid details fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
      return { 
        success: true, 
        count: successCount,
        errors: errorCount
      };
      
    } catch (error) {
      console.error("Failed to fetch bid details:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        count: 0 
      };
    }
  },
});

// Helper function to fetch bid details for a specific symbol
async function fetchBidDetailsForSymbol(ctx: any, symbol: string, companyName: string, status: string) {
  try {
    console.log(`Fetching bid details for symbol: ${symbol}`);
    
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
    }

    // Step 2: Visit the IPO issue information page to establish proper context
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Step 2: Visiting issue information page for ${symbol}...`);
    const issuePageUrl = `https://www.nseindia.com/market-data/issue-information?symbol=${symbol}&series=EQ&type=${encodeURIComponent(status)}`;
    
    const issuePageResponse = await fetch(issuePageUrl, {
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

    console.log(`Issue page response status: ${issuePageResponse.status}`);
    
    // Update cookies with any new ones from issue page
    const issuePageSetCookie = issuePageResponse.headers.get("set-cookie");
    if (issuePageSetCookie) {
      const newCookies = issuePageSetCookie
        .split(",")
        .map(cookie => cookie.split(";")[0].trim())
        .join("; ");
      cookieString = cookieString ? `${cookieString}; ${newCookies}` : newCookies;
    }

    // Step 3: Wait and then call the bid details API
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`Step 3: Calling bid details API for ${symbol}...`);
    const apiUrl = `https://www.nseindia.com/api/ipo-active-category?symbol=${symbol}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Referer": issuePageUrl,
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

    console.log(`Bid details API response status: ${apiResponse.status}`);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`Bid details API failed for ${symbol} with status ${apiResponse.status}:`, errorBody.substring(0, 500));
      return { success: false, error: `HTTP ${apiResponse.status}: ${errorBody.substring(0, 200)}`, count: 0 };
    }

    const data = await apiResponse.json();
    console.log(`Bid details API response received for ${symbol}, processing data...`);
    
    // The response structure contains dataList
    const bidDataList = data.dataList || [];

    if (!Array.isArray(bidDataList)) {
      console.error(`Expected array in dataList but got: ${typeof bidDataList}`);
      return { success: false, error: `Invalid data format`, count: 0 };
    }

    console.log(`Processing ${bidDataList.length} bid categories for ${symbol}...`);
    let processedCount = 0;

    // Skip the first entry if it's a header row
    const actualBidData = bidDataList.filter(item => 
      item.srNo && item.srNo !== "Sr.No." && item.srNo !== "[Sr.No](http://sr.no/)."
    );

    for (const bidDetail of actualBidData) {
      try {
        await ctx.runMutation(internal.bidDetails.upsertBidDetail, {
          symbol: symbol,
          companyName: companyName,
          srNo: bidDetail.srNo || "",
          category: bidDetail.category || "",
          noOfShareOffered: bidDetail.noOfShareOffered || "",
          noOfSharesBid: bidDetail.noOfSharesBid || "",
          noOfTotalMeant: bidDetail.noOfTotalMeant || "",
        });
        processedCount++;
      } catch (mutationError) {
        console.error(`Error upserting bid detail for ${symbol}:`, bidDetail, mutationError);
      }
    }

    console.log(`Successfully processed ${processedCount} bid categories for ${symbol}`);
    return { success: true, count: processedCount };

  } catch (error) {
    console.error(`Failed to fetch bid details for ${symbol}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", count: 0 };
  }
}
