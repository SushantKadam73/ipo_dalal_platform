import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch NSE IPO data every 30 seconds
crons.interval("fetch NSE IPO data", { seconds: 30 }, internal.nse.fetchNseData, {});

export default crons;
