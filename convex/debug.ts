import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Debug function to check IPO statuses
export const debugIpoStatuses = action({
  args: {},
  handler: async (ctx): Promise<{
    total?: number;
    statusCounts?: { [key: string]: number };
    seriesCounts?: { [key: string]: number };
    activeMainboardCount?: number;
    error?: string;
  }> => {
    try {
      const allIpos = await ctx.runQuery(internal.ipos.listIposInternal, {});
      
      console.log("=== IPO Status Debug ===");
      console.log(`Total IPOs in database: ${allIpos.length}`);
      
      const statusCounts: { [key: string]: number } = {};
      const seriesCounts: { [key: string]: number } = {};
      let activeMainboardCount = 0;
      
      allIpos.forEach(ipo => {
        // Count statuses
        statusCounts[ipo.status] = (statusCounts[ipo.status] || 0) + 1;
        
        // Count series
        seriesCounts[ipo.series] = (seriesCounts[ipo.series] || 0) + 1;
        
        // Count active mainboard
        if (ipo.series === "EQ" && ipo.status.toLowerCase().includes("active")) {
          activeMainboardCount++;
          console.log(`Active Mainboard IPO: ${ipo.symbol} - ${ipo.companyName} - Status: ${ipo.status}`);
        }
        
        console.log(`IPO: ${ipo.symbol} | Series: ${ipo.series} | Status: ${ipo.status} | LotSize: ${ipo.lotSize || 'not set'}`);
      });
      
      console.log("\n=== Summary ===");
      console.log("Status breakdown:", statusCounts);
      console.log("Series breakdown:", seriesCounts);
      console.log(`Active mainboard IPOs eligible for bid details: ${activeMainboardCount}`);
      
      return {
        total: allIpos.length,
        statusCounts,
        seriesCounts,
        activeMainboardCount
      };
    } catch (error) {
      console.error("Error in debugIpoStatuses:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
