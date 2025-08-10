import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch NSE IPO data every 30 seconds - COMMENTED OUT FOR TESTING
// crons.interval("fetch NSE IPO data", { seconds: 30 }, internal.nse.fetchNseData, {});

// Fetch bid details for mainboard IPOs every 2 minutes
crons.interval("fetch bid details", { minutes: 2 }, internal.bidDetailsFetch.fetchAllBidDetails, {});

export default crons;
