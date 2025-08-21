import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, action } from "./_generated/server";

// Manual trigger for sequential data collection (upcoming IPOs first, then bid details)
export const manualSequentialFetch = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; upcomingResult?: any; bidResult?: any; error?: string }> => {
    return await ctx.runAction(internal.crons.sequentialFetch, {});
  },
});

// Internal sequential fetch function
export const sequentialFetch = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; upcomingResult?: any; bidResult?: any; smeResult?: any; error?: string }> => {
    try {
      console.log("🚀 Starting sequential data collection...");
      
      // Step 1: Fetch upcoming IPOs first
      console.log("📊 Step 1: Fetching upcoming IPO data...");
      const upcomingResult: any = await ctx.runAction(internal.nse.fetchNseData, {});
      console.log("✅ Upcoming IPO fetch completed:", upcomingResult);
      
      // Step 2: Wait 30 seconds before fetching bid details
      console.log("⏳ Waiting 30 seconds before fetching bid details...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Step 3: Fetch mainboard bid details
      console.log("🎯 Step 2: Fetching mainboard bid details...");
      const bidResult: any = await ctx.runAction(internal.bidDetailsFetch.fetchAllBidDetails, {});
      console.log("✅ Mainboard bid details fetch completed:", bidResult);
      
      // Step 4: Wait 30 seconds before fetching SME bid details
      console.log("⏳ Waiting 30 seconds before fetching SME bid details...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Step 5: Fetch SME bid details
      console.log("🎯 Step 3: Fetching SME bid details...");
      const smeResult: any = await ctx.runAction(internal.bidDetailsFetchSME_new.fetchAllBidDetailsSME, {});
      console.log("✅ SME bid details fetch completed:", smeResult);
      
      console.log("🎉 Sequential data collection completed successfully!");
      return { 
        success: true, 
        upcomingResult,
        bidResult,
        smeResult
      };
      
    } catch (error) {
      console.error("💥 Sequential fetch failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

const crons = cronJobs();

// Fetch NSE upcoming IPO data every 1 hour
crons.interval("fetch NSE IPO data", { minutes: 60 }, internal.nse.fetchNseData, {});

// Fetch bid details for mainboard IPOs every 1 hour
crons.interval("fetch bid details", { minutes: 60 }, internal.bidDetailsFetch.fetchAllBidDetails, {});

// Fetch bid details for SME IPOs every 1 hour
crons.interval("fetch SME bid details", { minutes: 60 }, internal.bidDetailsFetchSME_new.fetchAllBidDetailsSME, {});

export default crons;
