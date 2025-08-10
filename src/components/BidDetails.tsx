import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SubscriptionCharts } from "./SubscriptionCharts";
import { SubscriptionTimeSeriesChart } from "./SubscriptionTimeSeriesChart";

interface BidDetailsProps {
  symbol: string;
  companyName: string;
}

export function BidDetails({ symbol, companyName }: BidDetailsProps) {
  const bidDetails = useQuery(api.bidDetails.getBidDetailsBySymbol, { symbol });
  const bidSummary = useQuery(api.bidDetails.getBidDetailsSummary, { symbol });
  
  // Try to get time series data - first check for EQ (mainboard), then SME
  const bidDetailsActiveEQ = useQuery(api.bidDetails.getBidDetailsActiveEQSummary, { symbol });
  const bidDetailsActiveSME = useQuery(api.bidDetails.getBidDetailsActiveSMESummary, { symbol });
  
  // Use whichever time series data is available
  const timeSeriesData = bidDetailsActiveEQ?.timeSeriesData || bidDetailsActiveSME?.timeSeriesData || null;
  const hasTimeSeriesData = timeSeriesData && timeSeriesData.length > 0;
  const isSME = bidDetailsActiveSME && !bidDetailsActiveEQ;

  if (bidDetails === undefined) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bidDetails || bidDetails.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No bid details available for {companyName}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {bidSummary && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Bid Summary for {companyName}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-xl font-bold text-gray-900">{bidSummary.totalCategories}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shares Offered</p>
              <p className="text-xl font-bold text-gray-900">
                {bidSummary.totalSharesOffered.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shares Bid</p>
              <p className="text-xl font-bold text-gray-900">
                {bidSummary.totalSharesBid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Subscription</p>
              <p className={`text-xl font-bold ${
                bidSummary.overallSubscription > 1 ? 'text-green-600' : 'text-red-600'
              }`}>
                {bidSummary.overallSubscription.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Charts */}
      <SubscriptionCharts 
        bidDetails={bidDetails} 
        companyName={companyName}
        symbol={symbol}
      />

      {/* Time Series Chart */}
      {hasTimeSeriesData && (
        <SubscriptionTimeSeriesChart
          timeSeriesData={timeSeriesData}
          symbol={symbol}
          companyName={companyName}
          type={isSME ? 'SME' : 'EQ'}
        />
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Category-wise Bid Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares Offered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares Bid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bidDetails.map((detail, index) => (
                <BidDetailRow key={index} detail={detail} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BidDetailRow({ detail }: { detail: any }) {
  const formatNumber = (value: string) => {
    if (!value || value === "" || isNaN(Number(value))) return "-";
    return Number(value).toLocaleString();
  };

  const getSubscriptionDisplay = (offered: string, bid: string) => {
    if (!offered || !bid || offered === "" || bid === "" || 
        isNaN(Number(offered)) || isNaN(Number(bid)) || Number(offered) === 0) {
      return "-";
    }
    const subscription = Number(bid) / Number(offered);
    return `${subscription.toFixed(2)}x`;
  };

  const getSubscriptionColor = (offered: string, bid: string) => {
    if (!offered || !bid || offered === "" || bid === "" || 
        isNaN(Number(offered)) || isNaN(Number(bid)) || Number(offered) === 0) {
      return "text-gray-500";
    }
    const subscription = Number(bid) / Number(offered);
    return subscription > 1 ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
        {detail.srNo}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="max-w-xs">
          {detail.category}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatNumber(detail.noOfShareOffered)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatNumber(detail.noOfSharesBid)}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getSubscriptionColor(detail.noOfShareOffered, detail.noOfSharesBid)}`}>
        {getSubscriptionDisplay(detail.noOfShareOffered, detail.noOfSharesBid)}
      </td>
    </tr>
  );
}
