import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";

export const listIpos = query({
  args: {
    status: v.optional(v.string()),
    series: v.optional(v.union(v.literal("EQ"), v.literal("SME"))),
  },
  handler: async (ctx, args) => {
    const { status, series } = args;

    if (status && series) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_status_and_series", (q) =>
          q.eq("status", status).eq("series", series)
        )
        .order("desc")
        .collect();
    } else if (status) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else if (series) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_series", (q) => q.eq("series", series))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("ipos").order("desc").collect();
  },
});

// Internal version for server-side use
export const listIposInternal = internalQuery({
  args: {
    status: v.optional(v.string()),
    series: v.optional(v.union(v.literal("EQ"), v.literal("SME"))),
  },
  handler: async (ctx, args) => {
    const { status, series } = args;

    if (status && series) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_status_and_series", (q) =>
          q.eq("status", status).eq("series", series)
        )
        .order("desc")
        .collect();
    } else if (status) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else if (series) {
      return await ctx.db
        .query("ipos")
        .withIndex("by_series", (q) => q.eq("series", series))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("ipos").order("desc").collect();
  },
});

export const getIpoBySymbol = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const ipo = await ctx.db
      .query("ipos")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
    return ipo;
  },
});

export const upsertIpo = internalMutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    series: v.union(v.literal("EQ"), v.literal("SME")),
    issueStartDate: v.string(),
    issueEndDate: v.string(),
    status: v.string(),
    issueSize: v.string(),
    issuePrice: v.string(),
    sr_no: v.number(),
    isBse: v.optional(v.string()),
    lotSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingIpo = await ctx.db
      .query("ipos")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    const ipoData = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existingIpo) {
      await ctx.db.patch(existingIpo._id, ipoData);
      return existingIpo._id;
    } else {
      return await ctx.db.insert("ipos", ipoData);
    }
  },
});

export const getIpoStats = query({
  args: {},
  handler: async (ctx) => {
    const allIpos = await ctx.db.query("ipos").collect();
    
    const stats = {
      total: allIpos.length,
      active: allIpos.filter(ipo => ipo.status.toLowerCase().includes("open")).length,
      upcoming: allIpos.filter(ipo => ipo.status.toLowerCase().includes("upcoming")).length,
      closed: allIpos.filter(ipo => ipo.status.toLowerCase().includes("closed")).length,
      mainboard: allIpos.filter(ipo => ipo.series === "EQ").length,
      sme: allIpos.filter(ipo => ipo.series === "SME").length,
    };
    
    return stats;
  },
});
