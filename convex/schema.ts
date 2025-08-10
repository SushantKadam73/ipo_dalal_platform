import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  ipos: defineTable({
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
    lastUpdated: v.number(),
  })
    .index("by_symbol", ["symbol"])
    .index("by_status", ["status"])
    .index("by_series", ["series"])
    .index("by_issue_start_date", ["issueStartDate"])
    .index("by_status_and_series", ["status", "series"]),
  
  bidDetailsMainboard: defineTable({
    symbol: v.string(),
    companyName: v.string(),
    srNo: v.string(),
    category: v.string(),
    noOfShareOffered: v.string(),
    noOfSharesBid: v.string(),
    noOfTotalMeant: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_symbol", ["symbol"])
    .index("by_symbol_and_category", ["symbol", "category"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
