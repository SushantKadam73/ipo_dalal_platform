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
      console.log("Starting bid details fetch for active mainboard IPOs...");
      
      // Get all mainboard (EQ series) IPOs with Active status from the database
      const mainboardIpos = await ctx.runQuery(internal.ipos.listIposInternal, {
        series: "EQ",
        status: "Active"
      });

      if (!mainboardIpos || mainboardIpos.length === 0) {
        console.log("No active mainboard IPOs found to fetch bid details for");
        return { success: true, count: 0, errors: 0 };
      }

      console.log(`Found ${mainboardIpos.length} active mainboard IPOs to process`);
      
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

// Helper function to extract and parse cookies from response headers
function extractCookiesFromResponse(response: Response, existingCookies: string = ""): string {
  const setCookieHeader = response.headers.get("set-cookie");
  if (!setCookieHeader) return existingCookies;

  // Parse all set-cookie headers more carefully
  const cookieMap = new Map<string, string>();
  
  // Parse existing cookies
  if (existingCookies) {
    existingCookies.split(";").forEach(cookie => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookieMap.set(name.trim(), value.trim());
      }
    });
  }

  // Parse new cookies from set-cookie header
  // Handle multiple cookies separated by comma (but be careful with expires dates)
  const cookieParts = setCookieHeader.split(/,(?=[^;]*=)/);
  
  for (const cookiePart of cookieParts) {
    const cookieAttributes = cookiePart.split(";");
    const nameValue = cookieAttributes[0].trim();
    const [name, value] = nameValue.split("=");
    
    if (name && value) {
      cookieMap.set(name.trim(), value.trim());
    }
  }

  // Convert back to cookie string
  return Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
}

// Helper function to get randomized headers
function getRandomizedHeaders(baseHeaders: Record<string, string>): Record<string, string> {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];
  
  const acceptLanguages = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.8,hi;q=0.7",
    "en-GB,en;q=0.9,en-US;q=0.8",
  ];

  return {
    ...baseHeaders,
    "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    "Accept-Language": acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
  };
}

// Helper function to fetch bid details for a specific symbol
async function fetchBidDetailsForSymbol(ctx: any, symbol: string, companyName: string, status: string) {
  try {
    console.log(`Fetching bid details for symbol: ${symbol}`);
    let sessionCookies = "";
    
    // Step 1: Visit NSE India homepage first to establish initial session
    console.log("Step 1: Visiting NSE India homepage...");
    const homepageHeaders = getRandomizedHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    });

    const homepageResponse = await fetch("https://www.nseindia.com", {
      method: "GET",
      headers: homepageHeaders,
    });

    console.log(`Homepage response status: ${homepageResponse.status}`);
    
    if (!homepageResponse.ok) {
      console.error(`Homepage request failed with status: ${homepageResponse.status}`);
      return { success: false, error: `Homepage access failed: ${homepageResponse.status}`, count: 0 };
    }

    // Extract cookies from homepage
    sessionCookies = extractCookiesFromResponse(homepageResponse, sessionCookies);
    console.log(`Extracted homepage cookies: ${sessionCookies ? 'Yes' : 'No'}`);

    // Step 2: Visit the IPO issue information page directly to establish proper context
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    console.log(`Step 2: Visiting issue information page for ${symbol}...`);
    const issuePageUrl = `https://www.nseindia.com/market-data/issue-information?symbol=${symbol}&series=EQ&type=Active`;
    
    const issuePageHeaders = getRandomizedHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Referer": "https://www.nseindia.com",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      ...(sessionCookies && { "Cookie": sessionCookies }),
    });

    const issuePageResponse = await fetch(issuePageUrl, {
      method: "GET",
      headers: issuePageHeaders,
    });

    console.log(`Issue page response status: ${issuePageResponse.status}`);
    
    if (issuePageResponse.ok) {
      sessionCookies = extractCookiesFromResponse(issuePageResponse, sessionCookies);
      console.log(`Updated cookies after issue page: ${sessionCookies ? 'Yes' : 'No'}`);
    } else {
      console.error(`Issue page request failed with status: ${issuePageResponse.status}`);
    }

    // Step 3: Wait and then call the bid details API directly
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    console.log(`Step 3: Calling bid details API for ${symbol}...`);
    const apiUrl = `https://www.nseindia.com/api/ipo-active-category?symbol=${symbol}`;
    
    const apiHeaders = getRandomizedHeaders({
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding": "gzip, deflate, br",
      "X-Requested-With": "XMLHttpRequest",
      "DNT": "1",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Referer": issuePageUrl,
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      ...(sessionCookies && { "Cookie": sessionCookies }),
    });

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: apiHeaders,
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
