import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { BidDetails } from "./components/BidDetails";

export function IpoDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<"EQ" | "SME" | "">("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingBids, setIsRefreshingBids] = useState(false);
  const [expandedBidDetails, setExpandedBidDetails] = useState<string | null>(null);
  
  const ipos = useQuery(api.ipos.listIpos, {
    status: selectedStatus || undefined,
    series: selectedSeries || undefined,
  });
  
  const stats = useQuery(api.ipos.getIpoStats);
  const manualFetch = useAction(api.nse.manualFetchNseData);
  const manualFetchBids = useAction(api.bidDetailsFetch.manualFetchBidDetails);
  const debugStatuses = useAction(api.debug.debugIpoStatuses);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await manualFetch({});
      console.log("Manual fetch result:", result);
      // You could show a toast notification here
    } catch (error) {
      console.error("Manual fetch failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualBidRefresh = async () => {
    setIsRefreshingBids(true);
    try {
      const result = await manualFetchBids({});
      console.log("Manual bid fetch result:", result);
      // You could show a toast notification here
    } catch (error) {
      console.error("Manual bid fetch failed:", error);
    } finally {
      setIsRefreshingBids(false);
    }
  };

  const handleDebugStatuses = async () => {
    try {
      const result = await debugStatuses({});
      console.log("Debug statuses result:", result);
    } catch (error) {
      console.error("Debug statuses failed:", error);
    }
  };

  if (ipos === undefined || stats === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IPO Dashboard</h1>
        <p className="text-gray-600">Real-time IPO data from NSE</p>
        <div className="mt-4 space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? "Refreshing..." : "Refresh NSE Data"}
          </button>
          <button
            onClick={handleManualBidRefresh}
            disabled={isRefreshingBids}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshingBids ? "Refreshing..." : "Refresh Bid Details"}
          </button>
          <button
            onClick={handleDebugStatuses}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Debug IPO Statuses
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total IPOs" value={stats.total} color="bg-blue-500" />
        <StatCard title="Active" value={stats.active} color="bg-green-500" />
        <StatCard title="Upcoming" value={stats.upcoming} color="bg-yellow-500" />
        <StatCard title="Closed" value={stats.closed} color="bg-gray-500" />
        <StatCard title="Mainboard" value={stats.mainboard} color="bg-purple-500" />
        <StatCard title="SME" value={stats.sme} color="bg-indigo-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Series</label>
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value as "EQ" | "SME" | "")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Series</option>
            <option value="EQ">Mainboard (EQ)</option>
            <option value="SME">SME</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedStatus("");
              setSelectedSeries("");
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* IPO List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            IPO Listings ({ipos.length} found)
          </h2>
        </div>
        
        {ipos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No IPOs found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Series
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ipos.map((ipo) => (
                  <React.Fragment key={ipo._id}>
                    <IpoRow 
                      ipo={ipo} 
                      onToggleBidDetails={(symbol) => 
                        setExpandedBidDetails(expandedBidDetails === symbol ? null : symbol)
                      }
                      showBidDetails={expandedBidDetails === ipo.symbol}
                    />
                    {expandedBidDetails === ipo.symbol && ipo.series === "EQ" && ipo.status.toLowerCase().includes("active") && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <BidDetails symbol={ipo.symbol} companyName={ipo.companyName} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function IpoRow({ ipo, onToggleBidDetails, showBidDetails }: { 
  ipo: any; 
  onToggleBidDetails?: (symbol: string) => void; 
  showBidDetails?: boolean; 
}) {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("open")) return "bg-green-100 text-green-800";
    if (lowerStatus.includes("upcoming")) return "bg-yellow-100 text-yellow-800";
    if (lowerStatus.includes("closed")) return "bg-gray-100 text-gray-800";
    return "bg-blue-100 text-blue-800";
  };

  const getSeriesColor = (series: string) => {
    return series === "EQ" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{ipo.companyName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono">{ipo.symbol}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeriesColor(ipo.series)}`}>
          {ipo.series}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>{ipo.issueStartDate}</div>
        <div className="text-gray-500">to {ipo.issueEndDate}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{ipo.issuePrice}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{ipo.issueSize}</div>
        {ipo.lotSize && (
          <div className="text-xs text-gray-500">Lot: {ipo.lotSize}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ipo.status)}`}>
          {ipo.status}
        </span>
        {ipo.isBse && (
          <div className="text-xs text-gray-500 mt-1">BSE: {ipo.isBse}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {ipo.series === "EQ" && ipo.status.toLowerCase().includes("active") && onToggleBidDetails ? (
          <button
            onClick={() => onToggleBidDetails(ipo.symbol)}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
          >
            {showBidDetails ? "Hide" : "View"} Bids
          </button>
        ) : (
          <span className="text-xs text-gray-400">N/A</span>
        )}
      </td>
    </tr>
  );
}
