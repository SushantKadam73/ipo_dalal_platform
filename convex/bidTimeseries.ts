import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// SR. NO. mapping for NSE API response to our schema fields (based on SR. NO. instead of category names)
const SR_NO_MAPPING: Record<string, string> = {
  // QIBs
  "1": "qib_total",           // Qualified Institutional Buyers(QIBs)
  "1(a)": "qib_fii",          // Foreign Institutional Investors(FIIs) 
  "1(b)": "qib_dfi",          // DFI
  "1(c)": "qib_mutual_funds", // Mutual funds
  "1(d)": "qib_others",       // Others Funds
  
  // NIIs
  "2": "nii_total",           // Non Institutional Investors
  "2.1": "nii_bnii_total",    // bNII/BHNI
  "2.1(a)": "nii_bnii_corporates", // Corporates
  "2.1(b)": "nii_bnii_individuals", // Individuals(Other than RIIs)
  "2.1(c)": "nii_bnii_others", // Others
  "2.2": "nii_snii_total",    // sNII/SHNI
  "2.2(a)": "nii_snii_corporates", // Corporates
  "2.2(b)": "nii_snii_individuals", // Individuals(Other than RIIs)
  "2.2(c)": "nii_snii_others", // Others
  
  // RIIs
  "3": "rii_total",           // Retail Individual Investors(RIIs)
  "3(a)": "rii_cutoff",       // Cut Off
  "3(b)": "rii_price_bids",   // Price bids
  
  // Employees
  "4": "employees_total",     // Employees
  "4(a)": "employees_cutoff", // Cut Off
  "4(b)": "employees_price_bids", // Price Bids
  
  // Others/Shareholders
  "5": "others_total",        // Other/Shareholder
  "5(a)": "others_cutoff",    // Cut Off
  "5(b)": "others_price_bids", // Price Bids
  
  // Total
  "-": "grand_total",         // Total
};

// Upsert timeseries data for a company and SR. NO.
export const upsertTimeseriesData = internalMutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    srNo: v.string(),
    noOfShareOffered: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
    apiTimestamp: v.string(), // Use API's own timestamp
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Map SR. NO. to schema field
    const schemaField = SR_NO_MAPPING[args.srNo];
    if (!schemaField) {
      console.warn(`Unknown SR. NO.: ${args.srNo}. Skipping.`);
      return null;
    }

    // Parse API timestamp to get comparable timestamp
    const apiTimestamp = parseApiTimestamp(args.apiTimestamp);
    
    // Find existing record
    const existing = await ctx.db
      .query("bidTimeseries")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();

    const newDataPoint = {
      timestamp: Date.now(), // System timestamp for when data was saved
      apiTimestamp: args.apiTimestamp, // Original API timestamp
      noOfShareOffered: args.noOfShareOffered,
      noOfSharesBid: args.noOfSharesBid,
      noOfTotalMeant: args.noOfTotalMeant,
    };

    if (existing) {
      // Check if we already have data for this API timestamp
      const currentCategoryData = (existing as any)[schemaField] || [];
      const existingApiTimestamp = currentCategoryData.find((item: any) => 
        item.apiTimestamp === args.apiTimestamp
      );
      
      // Only add if this API timestamp is new
      if (!existingApiTimestamp) {
        const updatedCategoryData = [...currentCategoryData, newDataPoint];
        
        const updateData: any = {
          lastUpdated: Date.now(),
          status: args.status || existing.status,
        };
        updateData[schemaField] = updatedCategoryData;

        await ctx.db.patch(existing._id, updateData);
        return existing._id;
      } else {
        console.log(`Data for ${args.symbol} SR.NO. ${args.srNo} with timestamp ${args.apiTimestamp} already exists. Skipping.`);
        return existing._id;
      }
    } else {
      // Create new record
      const createData: any = {
        symbol: args.symbol,
        companyName: args.companyName,
        lastUpdated: Date.now(),
        status: args.status || "Active",
      };
      createData[schemaField] = [newDataPoint];

      return await ctx.db.insert("bidTimeseries", createData);
    }
  },
});

// Helper function to parse API timestamp
function parseApiTimestamp(apiTimestamp: string): number {
  try {
    // Extract date and time from "Updated as on 08-Aug-2025 17:00:00"
    const match = apiTimestamp.match(/(\d{2})-(\w{3})-(\d{4})\s(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, day, monthStr, year, hour, minute, second] = match;
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];
      return new Date(parseInt(year), month, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)).getTime();
    }
    return Date.now();
  } catch (error) {
    console.warn("Failed to parse API timestamp:", apiTimestamp);
    return Date.now();
  }
}

// Get timeseries data for a specific company
export const getTimeseriesData = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bidTimeseries")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
  },
});

// Get all timeseries data for active IPOs
export const getAllActiveTimeseries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bidTimeseries")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();
  },
});

// Internal query for getting timeseries data
export const getTimeseriesDataInternal = internalQuery({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bidTimeseries")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
  },
});

// Get latest data point for each SR. NO. for a company
export const getLatestDataPoints = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("bidTimeseries")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();

    if (!data) return null;

    // Extract latest data point from each SR. NO.
    const latestData: any = {
      symbol: data.symbol,
      companyName: data.companyName,
      status: data.status,
      lastUpdated: data.lastUpdated,
    };

    // Get latest data point from each SR. NO.
    Object.entries(SR_NO_MAPPING).forEach(([srNo, field]) => {
      const categoryData = (data as any)[field];
      if (categoryData && categoryData.length > 0) {
        latestData[srNo] = categoryData[categoryData.length - 1];
      }
    });

    return latestData;
  },
});

// Clean old data points (keep only last N entries per SR. NO.)
export const cleanOldDataPoints = internalMutation({
  args: { 
    symbol: v.string(),
    keepLastN: v.optional(v.number()) // Default 100
  },
  handler: async (ctx, args) => {
    const keepLastN = args.keepLastN || 100;
    
    const existing = await ctx.db
      .query("bidTimeseries")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();

    if (!existing) return;

    const updateData: any = {};
    let hasUpdates = false;

    // Clean each SR. NO. array
    Object.values(SR_NO_MAPPING).forEach(field => {
      const categoryData = (existing as any)[field as string];
      if (categoryData && categoryData.length > keepLastN) {
        // Keep only the latest N entries
        updateData[field as string] = categoryData.slice(-keepLastN);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await ctx.db.patch(existing._id, updateData);
    }
  },
});

// Export SR. NO. mapping for use in other files
export { SR_NO_MAPPING };
