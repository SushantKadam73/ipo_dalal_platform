"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper function to format numeric strings
const formatNumericValue = (value: string | null | undefined): string => {
  if (!value) return "0";
  const num = parseFloat(value);
  if (isNaN(num)) return value; // Return original string if not a number
  if (value.toLowerCase().includes('e')) {
    return num.toFixed(0); // Convert scientific notation to full number
  }
  // Round to 3 decimal places if it's a float, otherwise return as is
  return Number.isInteger(num) ? num.toString() : num.toFixed(3);
};

// Helper function to process SME bid data for time series storage
async function processSMEBidData(ctx: any, data: any, symbol: string, companyName: string) {
  console.log(`Processing SME bid data for ${symbol}...`);
  console.log(`Raw API response:`, JSON.stringify(data, null, 2));

  const activeCat = data.activeCat || {};
  const bidDetails = data.bidDetails || [];
  const updateTime = activeCat.updateTime || "";

  if (!Array.isArray(activeCat.dataList) || !Array.isArray(bidDetails)) {
    console.error(`Expected arrays in activeCat.dataList and bidDetails but got:`, 
      typeof activeCat.dataList, typeof bidDetails);
    return { success: false, error: `Invalid data format`, count: 0 };
  }

  console.log(`Update time from API: ${updateTime}`);
  console.log(`Found ${activeCat.dataList.length} activeCat entries and ${bidDetails.length} bidDetails entries`);
  
  let processedCount = 0;

  // Create a map of bidDetails by category for quick lookup of noofapplication
  const bidDetailsMap = new Map();
  bidDetails.forEach((bid: any) => {
    if (bid.category) {
      bidDetailsMap.set(bid.category, bid);
    }
  });

  // Skip header rows but include Total rows (where srNo is null but category is "Total")
  const actualActiveCatData = activeCat.dataList.filter((item: any) => {
    // Include if srNo exists and is not a header
    if (item.srNo && item.srNo !== "Sr.No." && item.srNo !== "[Sr.No](http://sr.no/).") {
      return true;
    }
    // Also include Total rows (where srNo is null but category is "Total")
    if (!item.srNo && item.category && item.category.toLowerCase() === "total") {
      return true;
    }
    return false;
  });

  console.log(`Found ${actualActiveCatData.length} actual activeCat data entries after filtering headers`);

  for (const activeCatDetail of actualActiveCatData) {
    try {
      // Use "0" as srNo for total records, otherwise use the actual srNo or empty string
      const srNoValue = !activeCatDetail.srNo && activeCatDetail.category?.toLowerCase() === "total" 
        ? "0" 
        : (activeCatDetail.srNo || "");
      
      // Get corresponding bidDetails entry for noofapplication
      const correspondingBidDetail = bidDetailsMap.get(activeCatDetail.category);
      const noofapplication = correspondingBidDetail ? correspondingBidDetail.noofapplication : "0";
      
      console.log(`Processing ${activeCatDetail.category}: activeCat data with bidDetails application count ${noofapplication}`);
      
      // Store in the SME time series table
      await ctx.runMutation(internal.bidDetails.upsertBidDetailActiveSME, {
        symbol: symbol,
        srNo: srNoValue,
        category: activeCatDetail.category || "",
        noOfShareOffered: formatNumericValue(activeCatDetail.noOfShareOffered),
        noOfSharesBid: formatNumericValue(activeCatDetail.noOfSharesBid),
        noOfTotalMeant: formatNumericValue(activeCatDetail.noOfTotalMeant),
        noofapplication: formatNumericValue(noofapplication),
        updateTime: updateTime,
      });
      
      processedCount++;
      const isTotal = !activeCatDetail.srNo && activeCatDetail.category?.toLowerCase() === "total";
      const logPrefix = isTotal ? "🔢 [TOTAL]" : "✅";
      console.log(`${logPrefix} Processed SME bid detail for ${symbol} - ${activeCatDetail.category} (${srNoValue}) - Apps: ${noofapplication}`);
    } catch (mutationError) {
      console.error(`❌ Error upserting SME bid detail for ${symbol}:`, activeCatDetail, mutationError);
    }
  }

  console.log(`Successfully processed ${processedCount} SME bid categories for ${symbol}`);
  return { success: true, count: processedCount };
}

// Helper function to fetch bid details for a specific SME symbol
// Each call establishes a completely fresh session from scratch
async function fetchBidDetailsForSMESymbol(ctx: any, symbol: string, companyName: string, status: string) {
  try {
    console.log(`\n🆕 === FRESH SESSION START FOR SME ${symbol} ===`);
    console.log(`🔄 Starting completely independent session for SME: ${symbol} (${companyName})`);
    
    // Step 1: Visit NSE India homepage first to establish initial session
    console.log(`🏠 Step 1: Visiting NSE India homepage for fresh session...`);
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

    console.log(`🏠 Homepage response status: ${homepageResponse.status}`);
    
    // Extract cookies from homepage - fresh for this company
    let cookieString = "";
    const homepageSetCookie = homepageResponse.headers.get("set-cookie");
    if (homepageSetCookie) {
      cookieString = homepageSetCookie
        .split(",")
        .map(cookie => cookie.split(";")[0].trim())
        .join("; ");
      console.log(`🍪 Extracted fresh homepage cookies for SME ${symbol}: ${cookieString.length > 0 ? 'YES' : 'NO'}`);
    }

    // Step 2: Wait 3-5 seconds and then visit the SME issue information page
    console.log(`⏳ Waiting 3-5 seconds before visiting SME issue page for ${symbol}...`);
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    console.log(`📄 Step 2: Visiting SME issue information page for ${symbol}...`);
    const issuePageUrl = `https://www.nseindia.com/market-data/issue-information?symbol=${symbol}&series=SME&type=Active`;
    
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

    console.log(`📄 SME issue page response status for ${symbol}: ${issuePageResponse.status}`);
    
    // Update cookies with any new ones from issue page
    const issuePageSetCookie = issuePageResponse.headers.get("set-cookie");
    if (issuePageSetCookie) {
      const newCookies = issuePageSetCookie
        .split(",")
        .map(cookie => cookie.split(";")[0].trim())
        .join("; ");
      cookieString = cookieString ? `${cookieString}; ${newCookies}` : newCookies;
      console.log(`🍪 Updated cookies for SME ${symbol} with issue page cookies`);
    }

    // Step 3: Wait 4-6 seconds and then call the SME API
    console.log(`⏳ Waiting 4-6 seconds before calling SME bid details API for ${symbol}...`);
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));

    console.log(`🎯 Step 3: Calling SME bid details API for ${symbol}...`);
    const apiUrl = `https://www.nseindia.com/api/ipo-detail?symbol=${symbol}&series=SME`;
    
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

    console.log(`🎯 SME bid details API response status for ${symbol}: ${apiResponse.status}`);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`❌ SME bid details API failed for ${symbol} with status ${apiResponse.status}:`, errorBody.substring(0, 500));
      
      // If we get 403, try with different approach
      if (apiResponse.status === 403) {
        console.log(`🔄 Got 403 for SME ${symbol}, trying alternative approach...`);
        
        // Wait longer (7-10 seconds) and try again with minimal headers
        console.log(`⏳ Waiting 7-10 seconds before retry attempt for SME ${symbol}...`);
        await new Promise(resolve => setTimeout(resolve, 7000 + Math.random() * 3000));
        
        const retryResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": issuePageUrl,
            "Accept": "*/*",
            ...(cookieString && { "Cookie": cookieString }),
          },
        });
        
        console.log(`🔄 Retry response status for SME ${symbol}: ${retryResponse.status}`);
        
        if (!retryResponse.ok) {
          console.log(`💥 === SESSION FAILED FOR SME ${symbol} (RETRY ALSO FAILED) ===`);
          return { success: false, error: `Both attempts failed for SME ${symbol}. Last status: ${retryResponse.status}`, count: 0 };
        }
        
        const retryData = await retryResponse.json();
        console.log(`✅ Retry successful for SME ${symbol}, processing data...`);
        
        // Process retry data
        const result = await processSMEBidData(ctx, retryData, symbol, companyName);
        console.log(`🏁 === SESSION COMPLETE FOR SME ${symbol} (VIA RETRY) === Success: ${result.success}, Count: ${result.count} ===`);
        return result;
      } else {
        return { success: false, error: `HTTP ${apiResponse.status}: ${errorBody.substring(0, 200)}`, count: 0 };
      }
    }

    const data = await apiResponse.json();
    console.log(`✅ SME bid details API response received for ${symbol}, processing data...`);
    
    // Process the successful response
    const result = await processSMEBidData(ctx, data, symbol, companyName);
    console.log(`🏁 === SESSION COMPLETE FOR SME ${symbol} === Success: ${result.success}, Count: ${result.count} ===`);
    return result;

  } catch (error) {
    console.log(`💥 === SESSION FAILED FOR SME ${symbol} ===`);
    console.error(`💥 Failed to fetch SME bid details for ${symbol}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", count: 0 };
  }
}

// Manual trigger for testing SME bid details fetch
export const manualFetchBidDetailsSME = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; count?: number; errors?: number; error?: string }> => {
    try {
      console.log("Starting bid details fetch for active SME IPOs...");
      
      // Get all SME series IPOs with Active status from the database
      const smeIpos = await ctx.runQuery(internal.ipos.listIposInternal, {
        series: "SME",
        status: "Active"
      });

      if (!smeIpos || smeIpos.length === 0) {
        console.log("No active SME IPOs found to fetch bid details for");
        return { success: true, count: 0, errors: 0 };
      }

      console.log(`Found ${smeIpos.length} active SME IPOs to process`);
      
      let successCount = 0;
      let errorCount = 0;

      // Process each SME IPO with its own separate session
      for (const ipo of smeIpos) {
        try {
          console.log(`\n=== Starting fresh session for SME IPO: ${ipo.symbol} - ${ipo.companyName} ===`);
          
          const result = await fetchBidDetailsForSMESymbol(ctx, ipo.symbol, ipo.companyName, ipo.status);
          
          if (result.success) {
            successCount++;
            console.log(`✅ Successfully processed ${result.count} bid categories for SME ${ipo.symbol}`);
          } else {
            errorCount++;
            console.error(`❌ Failed to process bid details for SME ${ipo.symbol}:`, result.error);
          }

          // Add longer delay between companies to allow sessions to fully reset
          console.log(`⏳ Waiting 8-12 seconds before processing next SME company to ensure fresh session...`);
          await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
          
        } catch (error) {
          console.error(`💥 Error processing SME IPO ${ipo.symbol}:`, error);
          errorCount++;
        }
      }

      console.log(`\n🎯 SME bid details fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
      return { 
        success: true, 
        count: successCount,
        errors: errorCount
      };
      
    } catch (error) {
      console.error("Failed to fetch SME bid details:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        count: 0 
      };
    }
  },
});

export const fetchAllBidDetailsSME = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Starting bid details fetch for active SME IPOs...");
      
      // Get all SME series IPOs with Active status from the database
      const smeIpos = await ctx.runQuery(internal.ipos.listIposInternal, {
        series: "SME",
        status: "Active"
      });

      if (!smeIpos || smeIpos.length === 0) {
        console.log("No active SME IPOs found to fetch bid details for");
        return { success: true, count: 0, errors: 0 };
      }

      console.log(`Found ${smeIpos.length} active SME IPOs to process`);
      
      let successCount = 0;
      let errorCount = 0;

      // Process each SME IPO with its own separate session
      for (const ipo of smeIpos) {
        try {
          console.log(`\n=== Starting fresh session for SME IPO: ${ipo.symbol} - ${ipo.companyName} ===`);
          
          const result = await fetchBidDetailsForSMESymbol(ctx, ipo.symbol, ipo.companyName, ipo.status);
          
          if (result.success) {
            successCount++;
            console.log(`✅ Successfully processed ${result.count} bid categories for SME ${ipo.symbol}`);
          } else {
            errorCount++;
            console.error(`❌ Failed to process bid details for SME ${ipo.symbol}:`, result.error);
          }

          // Add longer delay between companies to allow sessions to fully reset
          console.log(`⏳ Waiting 8-12 seconds before processing next SME company to ensure fresh session...`);
          await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
          
        } catch (error) {
          console.error(`💥 Error processing SME IPO ${ipo.symbol}:`, error);
          errorCount++;
        }
      }

      console.log(`\n🎯 SME bid details fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
      return { 
        success: true, 
        count: successCount,
        errors: errorCount
      };
      
    } catch (error) {
      console.error("Failed to fetch SME bid details:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        count: 0 
      };
    }
  },
});
