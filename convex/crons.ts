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
  handler: async (ctx): Promise<{ success: boolean; upcomingResult?: any; bidResult?: any; error?: string }> => {
    try {
      console.log("🚀 Starting sequential data collection...");
      
      // Step 1: Fetch upcoming IPOs first
      console.log("📊 Step 1: Fetching upcoming IPO data...");
      const upcomingResult: any = await ctx.runAction(internal.nse.fetchNseData, {});
      console.log("✅ Upcoming IPO fetch completed:", upcomingResult);
      
      // Step 2: Wait 30 seconds before fetching bid details
      console.log("⏳ Waiting 30 seconds before fetching bid details...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Step 3: Fetch bid details
      console.log("🎯 Step 2: Fetching bid details...");
      const bidResult: any = await ctx.runAction(internal.bidDetailsFetch.fetchAllBidDetails, {});
      console.log("✅ Bid details fetch completed:", bidResult);
      
      console.log("🎉 Sequential data collection completed successfully!");
      return { 
        success: true, 
        upcomingResult,
        bidResult 
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

// Fetch NSE upcoming IPO data every 5 minutes
crons.interval("fetch NSE IPO data", { minutes: 5 }, internal.nse.fetchNseData, {});

// Fetch bid details for mainboard IPOs every 1 minute
crons.interval("fetch bid details", { minutes: 1 }, internal.bidDetailsFetch.fetchAllBidDetails, {});

// Fetch bid details for SME IPOs every 2 minutes
crons.interval("fetch SME bid details", { minutes: 2 }, internal.bidDetailsFetchSME.fetchAllBidDetailsSME, {});

export default crons;
