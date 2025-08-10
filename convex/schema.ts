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

  // New Timeseries Bid Data Schema - Companies as rows, Categories as columns
  bidTimeseries: defineTable({
    symbol: v.string(),
    companyName: v.string(),
    
    // Qualified Institutional Buyers (QIBs)
    qib_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    qib_fii: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    qib_dfi: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    qib_mutual_funds: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    qib_others: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Non Institutional Investors  
    nii_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_bnii_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_bnii_corporates: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_bnii_individuals: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_bnii_others: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_snii_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_snii_corporates: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_snii_individuals: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    nii_snii_others: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Retail Individual Investors (RIIs)
    rii_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    rii_cutoff: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    rii_price_bids: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Employees
    employees_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    employees_cutoff: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    employees_price_bids: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Others
    others_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    others_cutoff: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),
    others_price_bids: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Grand Total
    grand_total: v.optional(v.array(v.object({
      timestamp: v.number(),
      noOfShareOffered: v.string(),
      noOfSharesBid: v.string(),
      noOfTotalMeant: v.string(),
      subscriptionRatio: v.optional(v.string()),
    }))),

    // Metadata
    lastUpdated: v.number(),
    status: v.string(), // Active, Closed, etc.
  })
    .index("by_symbol", ["symbol"])
    .index("by_status", ["status"])
    .index("by_last_updated", ["lastUpdated"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
