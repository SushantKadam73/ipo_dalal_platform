import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Test function to verify the new bidDetailsActiveEQ table structure
export const testBidDetailsActiveEQ = query({
  args: { symbol: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const symbol = args.symbol || "ALLTIME";
    
    // Get data from new time series table
    const bidDetailsActiveEQ = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .collect();

    console.log(`Found ${bidDetailsActiveEQ.length} records in bidDetailsActiveEQ for ${symbol}`);
    
    // Format data for easy inspection
    const formattedData = bidDetailsActiveEQ.map(record => ({
      category: record.category,
      srNo: record.srNo,
      noOfShareOffered: record.noOfShareOffered,
      timeSeriesPointsCount: {
        noOfSharesBid: record.noOfSharesBid.length,
        noOfTotalMeant: record.noOfTotalMeant.length,
      },
      latestValues: {
        noOfSharesBid: record.noOfSharesBid.length > 0 
          ? record.noOfSharesBid[record.noOfSharesBid.length - 1] 
          : null,
        noOfTotalMeant: record.noOfTotalMeant.length > 0 
          ? record.noOfTotalMeant[record.noOfTotalMeant.length - 1] 
          : null,
      },
      updateTime: record.updateTime,
      lastUpdated: record.lastUpdated,
    }));

    return {
      symbol,
      totalRecords: bidDetailsActiveEQ.length,
      records: formattedData,
    };
  },
});

// Test function to manually add a data point to simulate time series growth
export const addTestDataPoint = mutation({
  args: {
    symbol: v.string(),
    srNo: v.string(),
    category: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Find existing record
    const existingRecord = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol_and_category", (q) => 
        q.eq("symbol", args.symbol).eq("category", args.category)
      )
      .filter((q) => q.eq(q.field("srNo"), args.srNo))
      .first();

    if (!existingRecord) {
      throw new Error(`No existing record found for ${args.symbol} - ${args.category} (${args.srNo})`);
    }

    // Add new data points
    const updatedNoOfSharesBid = [...existingRecord.noOfSharesBid];
    const updatedNoOfTotalMeant = [...existingRecord.noOfTotalMeant];
    
    updatedNoOfSharesBid.push({
      value: args.noOfSharesBid,
      timestamp: timestamp,
    });
    
    updatedNoOfTotalMeant.push({
      value: args.noOfTotalMeant,
      timestamp: timestamp,
    });

    await ctx.db.patch(existingRecord._id, {
      noOfSharesBid: updatedNoOfSharesBid,
      noOfTotalMeant: updatedNoOfTotalMeant,
      updateTime: `Updated as on ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`,
      lastUpdated: timestamp,
    });

    return {
      success: true,
      recordId: existingRecord._id,
      newDataPointsCount: {
        noOfSharesBid: updatedNoOfSharesBid.length,
        noOfTotalMeant: updatedNoOfTotalMeant.length,
      },
    };
  },
});

// Compare old vs new table data
export const compareTableData = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    // Get data from old table
    const oldTableData = await ctx.db
      .query("bidDetailsMainboard")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();

    // Get data from new table
    const newTableData = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();

    return {
      symbol: args.symbol,
      oldTable: {
        count: oldTableData.length,
        categories: oldTableData.map(r => r.category),
        sampleRecord: oldTableData[0] || null,
      },
      newTable: {
        count: newTableData.length,
        categories: newTableData.map(r => r.category),
        sampleRecord: newTableData[0] ? {
          ...newTableData[0],
          timeSeriesLengths: {
            noOfSharesBid: newTableData[0].noOfSharesBid.length,
            noOfTotalMeant: newTableData[0].noOfTotalMeant.length,
          }
        } : null,
      },
    };
  },
});
