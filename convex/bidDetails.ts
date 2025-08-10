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
