import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

export const listBidDetails = query({
  args: {
    symbol: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.symbol) {
      return await ctx.db
        .query("bidDetailsMainboard")
        .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol!))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("bidDetailsMainboard").order("desc").collect();
  },
});

export const getBidDetailsBySymbol = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsMainboard")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    return bidDetails;
  },
});

export const upsertBidDetail = internalMutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    srNo: v.string(),
    category: v.string(),
    noOfShareOffered: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
  },
  handler: async (ctx, args) => {
    const existingBidDetail = await ctx.db
      .query("bidDetailsMainboard")
      .withIndex("by_symbol_and_category", (q) => 
        q.eq("symbol", args.symbol).eq("category", args.category)
      )
      .first();

    const bidDetailData = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existingBidDetail) {
      await ctx.db.patch(existingBidDetail._id, bidDetailData);
      return existingBidDetail._id;
    } else {
      return await ctx.db.insert("bidDetailsMainboard", bidDetailData);
    }
  },
});

export const getBidDetailsSummary = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsMainboard")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    
    if (bidDetails.length === 0) {
      return null;
    }

    // Calculate summary statistics
    const totalSharesOffered = bidDetails
      .filter(bd => bd.noOfShareOffered && !isNaN(Number(bd.noOfShareOffered)))
      .reduce((sum, bd) => sum + Number(bd.noOfShareOffered), 0);
      
    const totalSharesBid = bidDetails
      .filter(bd => bd.noOfSharesBid && !isNaN(Number(bd.noOfSharesBid)))
      .reduce((sum, bd) => sum + Number(bd.noOfSharesBid), 0);

    const overallSubscription = totalSharesOffered > 0 ? totalSharesBid / totalSharesOffered : 0;

    return {
      symbol: args.symbol,
      companyName: bidDetails[0]?.companyName || "",
      totalCategories: bidDetails.length,
      totalSharesOffered,
      totalSharesBid,
      overallSubscription,
      lastUpdated: Math.max(...bidDetails.map(bd => bd.lastUpdated)),
    };
  },
});

// New functions for bidDetailsActiveEQ time series table

export const listBidDetailsActiveEQ = query({
  args: {
    symbol: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.symbol) {
      return await ctx.db
        .query("bidDetailsActiveEQ")
        .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol!))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("bidDetailsActiveEQ").order("desc").collect();
  },
});

export const getBidDetailsActiveEQBySymbol = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    return bidDetails;
  },
});

export const upsertBidDetailActiveEQ = internalMutation({
  args: {
    symbol: v.string(),
    srNo: v.string(),
    category: v.string(),
    noOfShareOffered: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
    updateTime: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Find existing record by symbol, srNo and category
    const existingBidDetail = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol_and_category", (q) => 
        q.eq("symbol", args.symbol).eq("category", args.category)
      )
      .filter((q) => q.eq(q.field("srNo"), args.srNo))
      .first();

    if (existingBidDetail) {
      // Add new data points to existing time series
      const updatedNoOfSharesBid = [...existingBidDetail.noOfSharesBid];
      const updatedNoOfTotalMeant = [...existingBidDetail.noOfTotalMeant];
      
      // Add new data point for noOfSharesBid
      updatedNoOfSharesBid.push({
        value: args.noOfSharesBid,
        timestamp: timestamp,
      });
      
      // Add new data point for noOfTotalMeant
      updatedNoOfTotalMeant.push({
        value: args.noOfTotalMeant,
        timestamp: timestamp,
      });

      // Keep only last 100 data points to prevent unlimited growth
      if (updatedNoOfSharesBid.length > 100) {
        updatedNoOfSharesBid.splice(0, updatedNoOfSharesBid.length - 100);
      }
      if (updatedNoOfTotalMeant.length > 100) {
        updatedNoOfTotalMeant.splice(0, updatedNoOfTotalMeant.length - 100);
      }

      await ctx.db.patch(existingBidDetail._id, {
        noOfShareOffered: args.noOfShareOffered,
        noOfSharesBid: updatedNoOfSharesBid,
        noOfTotalMeant: updatedNoOfTotalMeant,
        updateTime: args.updateTime,
        lastUpdated: timestamp,
      });
      
      return existingBidDetail._id;
    } else {
      // Create new record with initial data points
      return await ctx.db.insert("bidDetailsActiveEQ", {
        symbol: args.symbol,
        srNo: args.srNo,
        category: args.category,
        noOfShareOffered: args.noOfShareOffered,
        noOfSharesBid: [{
          value: args.noOfSharesBid,
          timestamp: timestamp,
        }],
        noOfTotalMeant: [{
          value: args.noOfTotalMeant,
          timestamp: timestamp,
        }],
        updateTime: args.updateTime,
        lastUpdated: timestamp,
      });
    }
  },
});

export const getBidDetailsActiveEQSummary = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsActiveEQ")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    
    if (bidDetails.length === 0) {
      return null;
    }

    // Get latest values from time series data
    const getLatestValue = (timeSeries: Array<{value: string, timestamp: number}>) => {
      if (timeSeries.length === 0) return "0";
      return timeSeries[timeSeries.length - 1].value;
    };

    // Calculate summary statistics using latest values
    const totalSharesOffered = bidDetails
      .filter(bd => bd.noOfShareOffered && !isNaN(Number(bd.noOfShareOffered)))
      .reduce((sum, bd) => sum + Number(bd.noOfShareOffered), 0);
      
    const totalSharesBid = bidDetails
      .filter(bd => bd.noOfSharesBid.length > 0)
      .reduce((sum, bd) => {
        const latestValue = getLatestValue(bd.noOfSharesBid);
        return sum + (isNaN(Number(latestValue)) ? 0 : Number(latestValue));
      }, 0);

    const overallSubscription = totalSharesOffered > 0 ? totalSharesBid / totalSharesOffered : 0;

    // Get time series data for charting
    const timeSeriesData = bidDetails.map(bd => ({
      category: bd.category,
      srNo: bd.srNo,
      noOfSharesBidSeries: bd.noOfSharesBid,
      noOfTotalMeantSeries: bd.noOfTotalMeant,
    }));

    return {
      symbol: args.symbol,
      totalCategories: bidDetails.length,
      totalSharesOffered,
      totalSharesBid,
      overallSubscription,
      lastUpdated: Math.max(...bidDetails.map(bd => bd.lastUpdated)),
      updateTime: bidDetails[0]?.updateTime || "",
      timeSeriesData,
    };
  },
});

// SME Bid Details Functions

export const listBidDetailsActiveSME = query({
  args: {
    symbol: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.symbol) {
      return await ctx.db
        .query("bidDetailsActiveSME")
        .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol!))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("bidDetailsActiveSME").order("desc").collect();
  },
});

export const getBidDetailsActiveSMEBySymbol = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    return bidDetails;
  },
});

export const upsertBidDetailActiveSME = internalMutation({
  args: {
    symbol: v.string(),
    srNo: v.string(),
    category: v.string(),
    noOfShareOffered: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
    noofapplication: v.string(),
    updateTime: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Find existing record by symbol, srNo and category
    const existingBidDetail = await ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol_and_category", (q) => 
        q.eq("symbol", args.symbol).eq("category", args.category)
      )
      .filter((q) => q.eq(q.field("srNo"), args.srNo))
      .first();

    if (existingBidDetail) {
      // Add new data points to existing time series
      const updatedNoOfSharesBid = [...existingBidDetail.noOfSharesBid];
      const updatedNoOfTotalMeant = [...existingBidDetail.noOfTotalMeant];
      const updatedNoofapplication = [...existingBidDetail.noofapplication];
      
      // Add new data points
      updatedNoOfSharesBid.push({
        value: args.noOfSharesBid,
        timestamp: timestamp,
      });
      
      updatedNoOfTotalMeant.push({
        value: args.noOfTotalMeant,
        timestamp: timestamp,
      });

      updatedNoofapplication.push({
        value: args.noofapplication,
        timestamp: timestamp,
      });

      // Keep only last 100 data points to prevent unlimited growth
      if (updatedNoOfSharesBid.length > 100) {
        updatedNoOfSharesBid.splice(0, updatedNoOfSharesBid.length - 100);
      }
      if (updatedNoOfTotalMeant.length > 100) {
        updatedNoOfTotalMeant.splice(0, updatedNoOfTotalMeant.length - 100);
      }
      if (updatedNoofapplication.length > 100) {
        updatedNoofapplication.splice(0, updatedNoofapplication.length - 100);
      }

      await ctx.db.patch(existingBidDetail._id, {
        noOfShareOffered: args.noOfShareOffered,
        noOfSharesBid: updatedNoOfSharesBid,
        noOfTotalMeant: updatedNoOfTotalMeant,
        noofapplication: updatedNoofapplication,
        updateTime: args.updateTime,
        lastUpdated: timestamp,
      });
      
      return existingBidDetail._id;
    } else {
      // Create new record with initial data points
      return await ctx.db.insert("bidDetailsActiveSME", {
        symbol: args.symbol,
        srNo: args.srNo,
        category: args.category,
        noOfShareOffered: args.noOfShareOffered,
        noOfSharesBid: [{
          value: args.noOfSharesBid,
          timestamp: timestamp,
        }],
        noOfTotalMeant: [{
          value: args.noOfTotalMeant,
          timestamp: timestamp,
        }],
        noofapplication: [{
          value: args.noofapplication,
          timestamp: timestamp,
        }],
        updateTime: args.updateTime,
        lastUpdated: timestamp,
      });
    }
  },
});

export const getBidDetailsActiveSMESummary = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
    
    if (bidDetails.length === 0) {
      return null;
    }

    // Get latest values from time series data
    const getLatestValue = (timeSeries: Array<{value: string, timestamp: number}>) => {
      if (timeSeries.length === 0) return "0";
      return timeSeries[timeSeries.length - 1].value;
    };

    // Calculate summary statistics using latest values
    const totalSharesOffered = bidDetails
      .filter(bd => bd.noOfShareOffered && !isNaN(Number(bd.noOfShareOffered)))
      .reduce((sum, bd) => sum + Number(bd.noOfShareOffered), 0);
      
    const totalSharesBid = bidDetails
      .filter(bd => bd.noOfSharesBid.length > 0)
      .reduce((sum, bd) => {
        const latestValue = getLatestValue(bd.noOfSharesBid);
        return sum + (isNaN(Number(latestValue)) ? 0 : Number(latestValue));
      }, 0);

    const totalApplications = bidDetails
      .filter(bd => bd.noofapplication.length > 0)
      .reduce((sum, bd) => {
        const latestValue = getLatestValue(bd.noofapplication);
        return sum + (isNaN(Number(latestValue)) ? 0 : Number(latestValue));
      }, 0);

    const overallSubscription = totalSharesOffered > 0 ? totalSharesBid / totalSharesOffered : 0;

    // Get time series data for charting
    const timeSeriesData = bidDetails.map(bd => ({
      category: bd.category,
      srNo: bd.srNo,
      noOfSharesBidSeries: bd.noOfSharesBid,
      noOfTotalMeantSeries: bd.noOfTotalMeant,
      noofapplicationSeries: bd.noofapplication,
    }));

    return {
      symbol: args.symbol,
      totalCategories: bidDetails.length,
      totalSharesOffered,
      totalSharesBid,
      totalApplications,
      overallSubscription,
      lastUpdated: Math.max(...bidDetails.map(bd => bd.lastUpdated)),
      updateTime: bidDetails[0]?.updateTime || "",
      timeSeriesData,
    };
  },
});

// Get all SME bid details for a symbol
export const getBidDetailsActiveSME = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();
  },
});

// Get latest SME bid details across all symbols
export const getLatestBidDetailsActiveSME = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bidDetailsActiveSME")
      .order("desc")
      .take(100);
  },
});

// Get SME bid details for specific symbol and category
export const getBidDetailsActiveSMEByCategory = query({
  args: { 
    symbol: v.string(),
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol", (query) => query.eq("symbol", args.symbol));
    
    if (args.category) {
      q = q.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    return await q.order("desc").collect();
  },
});

// Get SME bid details summary for a symbol with time series data
export const getBidDetailsSummaryActiveSME = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const bidDetails = await ctx.db
      .query("bidDetailsActiveSME")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .collect();

    if (bidDetails.length === 0) {
      return null;
    }

    // Helper function to get latest value from time series
    const getLatestValue = (timeSeries: Array<{ value: string; timestamp: number }>) => {
      if (timeSeries.length === 0) return "0";
      return timeSeries[timeSeries.length - 1].value;
    };

    // Calculate summary statistics using latest values
    const totalSharesOffered = bidDetails
      .filter(bd => bd.noOfShareOffered && !isNaN(Number(bd.noOfShareOffered)))
      .reduce((sum, bd) => sum + Number(bd.noOfShareOffered), 0);
      
    const totalSharesBid = bidDetails
      .filter(bd => bd.noOfSharesBid.length > 0)
      .reduce((sum, bd) => {
        const latestValue = getLatestValue(bd.noOfSharesBid);
        return sum + (isNaN(Number(latestValue)) ? 0 : Number(latestValue));
      }, 0);

    const totalApplications = bidDetails
      .filter(bd => bd.noofapplication.length > 0)
      .reduce((sum, bd) => {
        const latestValue = getLatestValue(bd.noofapplication);
        return sum + (isNaN(Number(latestValue)) ? 0 : Number(latestValue));
      }, 0);

    const overallSubscription = totalSharesOffered > 0 ? totalSharesBid / totalSharesOffered : 0;

    // Get time series data for charting
    const timeSeriesData = bidDetails.map(bd => ({
      category: bd.category,
      srNo: bd.srNo,
      noOfSharesBidSeries: bd.noOfSharesBid,
      noOfTotalMeantSeries: bd.noOfTotalMeant,
      noofapplicationSeries: bd.noofapplication,
    }));

    return {
      symbol: args.symbol,
      totalCategories: bidDetails.length,
      totalSharesOffered,
      totalSharesBid,
      totalApplications,
      overallSubscription,
      lastUpdated: Math.max(...bidDetails.map(bd => bd.lastUpdated)),
      updateTime: bidDetails[0]?.updateTime || "",
      timeSeriesData,
    };
  },
});
