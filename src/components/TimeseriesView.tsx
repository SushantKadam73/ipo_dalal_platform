import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// SR. NO. to Category Name mapping for display
const SR_NO_TO_CATEGORY: Record<string, string> = {
  // QIBs
  "1": "Qualified Institutional Buyers(QIBs)",
  "1(a)": "Foreign Institutional Investors(FIIs)",
  "1(b)": "DFI",
  "1(c)": "Mutual funds",
  "1(d)": "Others Funds",
  
  // NIIs
  "2": "Non Institutional Investors",
  "2.1": "bNII/BHNI",
  "2.1(a)": "Corporates (bNII)",
  "2.1(b)": "Individuals(Other than RIIs) (bNII)",
  "2.1(c)": "Others (bNII)",
  "2.2": "sNII/SHNI",
  "2.2(a)": "Corporates (sNII)",
  "2.2(b)": "Individuals(Other than RIIs) (sNII)",
  "2.2(c)": "Others (sNII)",
  
  // RIIs
  "3": "Retail Individual Investors(RIIs)",
  "3(a)": "RII - Cut Off",
  "3(b)": "RII - Price bids",
  
  // Employees
  "4": "Employees",
  "4(a)": "Employees - Cut Off",
  "4(b)": "Employees - Price Bids",
  
  // Others/Shareholders
  "5": "Other/Shareholder",
  "5(a)": "Other - Cut Off",
  "5(b)": "Other - Price Bids",
  
  // Total
  "-": "Total",
};

// Schema field to SR. NO. mapping (reverse of SR_NO_MAPPING from backend)
const FIELD_TO_SR_NO: Record<string, string> = {
  "qib_total": "1",
  "qib_fii": "1(a)",
  "qib_dfi": "1(b)",
  "qib_mutual_funds": "1(c)",
  "qib_others": "1(d)",
  "nii_total": "2",
  "nii_bnii_total": "2.1",
  "nii_bnii_corporates": "2.1(a)",
  "nii_bnii_individuals": "2.1(b)",
  "nii_bnii_others": "2.1(c)",
  "nii_snii_total": "2.2",
  "nii_snii_corporates": "2.2(a)",
  "nii_snii_individuals": "2.2(b)",
  "nii_snii_others": "2.2(c)",
  "rii_total": "3",
  "rii_cutoff": "3(a)",
  "rii_price_bids": "3(b)",
  "employees_total": "4",
  "employees_cutoff": "4(a)",
  "employees_price_bids": "4(b)",
  "others_total": "5",
  "others_cutoff": "5(a)",
  "others_price_bids": "5(b)",
  "grand_total": "-",
};

interface TimeseriesViewProps {
  symbol: string;
  companyName: string;
}

const TimeseriesView: React.FC<TimeseriesViewProps> = ({ symbol, companyName }) => {
  const [selectedSrNo, setSelectedSrNo] = useState<string>('all');
  const timeseriesData = useQuery(api.bidTimeseries.getTimeseriesData, { symbol });

  if (!timeseriesData) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Extract data organized by SR. NO. from the schema fields
  const dataEntries = (() => {
    if (!timeseriesData) return [];
    
    const entries: [string, any[]][] = [];
    
    // Map schema fields back to SR. NO.
    Object.entries(FIELD_TO_SR_NO).forEach(([field, srNo]) => {
      const fieldData = (timeseriesData as any)[field];
      if (Array.isArray(fieldData) && fieldData.length > 0) {
        entries.push([srNo, fieldData]);
      }
    });
    
    return entries;
  })();

  if (dataEntries.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          � Timeseries Data - {companyName} ({symbol})
        </h3>
        <p className="text-gray-500">No timeseries data available</p>
      </div>
    );
  }

  // Helper functions
  const formatNumber = (numStr: string) => {
    try {
      const num = parseFloat(numStr.replace(/[^0-9.-]/g, ''));
      if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
      if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toFixed(0);
    } catch {
      return numStr;
    }
  };

  const calculateSubscriptionRatio = (sharesBid: string, sharesOffered: string): string => {
    try {
      const bid = parseFloat(sharesBid.replace(/[^0-9.-]/g, '')) || 0;
      const offered = parseFloat(sharesOffered.replace(/[^0-9.-]/g, '')) || 0;
      if (offered === 0) return '0%';
      const ratio = (bid / offered) * 100;
      return ratio.toFixed(2) + '%';
    } catch {
      return '0%';
    }
  };

  const getSubscriptionColor = (ratio: string) => {
    const num = parseFloat(ratio);
    if (num >= 100) return 'text-green-600 font-bold';
    if (num >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600';
  };

  const renderSrNoData = (srNo: string, categoryData: any[]) => {
    if (!categoryData || categoryData.length === 0) return null;

    const latest = categoryData[categoryData.length - 1];
    const categoryName = SR_NO_TO_CATEGORY[srNo] || `SR.NO. ${srNo}`;
    const subscriptionRatio = calculateSubscriptionRatio(latest.noOfSharesBid, latest.noOfShareOffered);

    return (
      <div key={srNo} className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">SR. {srNo}</h4>
            <p className="text-sm text-gray-600">{categoryName}</p>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${getSubscriptionColor(subscriptionRatio)}`}>
              {subscriptionRatio}
            </span>
            <div className="text-xs text-gray-500">
              {latest.apiTimestamp?.split(' ').slice(-2).join(' ') || 'No time'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <span className="text-gray-500">Offered:</span>
            <div className="font-medium">{formatNumber(latest.noOfShareOffered)}</div>
          </div>
          <div>
            <span className="text-gray-500">Bid:</span>
            <div className="font-medium">{formatNumber(latest.noOfSharesBid)}</div>
          </div>
          <div>
            <span className="text-gray-500">Times:</span>
            <div className="font-medium">{formatNumber(latest.noOfTotalMeant)}</div>
          </div>
        </div>

        {categoryData.length > 1 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">
              Historical Data ({categoryData.length} updates):
            </div>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left">API Time</th>
                    <th className="text-right">Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData
                    .slice(-5) // Show last 5 entries
                    .reverse()
                    .map((point, idx) => {
                      const ratio = calculateSubscriptionRatio(point.noOfSharesBid, point.noOfShareOffered);
                      return (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="py-1">
                            {point.apiTimestamp?.split(' ').slice(-2).join(' ') || 'Unknown'}
                          </td>
                          <td className={`py-1 text-right ${getSubscriptionColor(ratio)}`}>
                            {ratio}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Create filter options from available data
  const availableSrNos = dataEntries
    .filter(([_, data]) => Array.isArray(data) && data.length > 0)
    .map(([srNo]) => srNo)
    .sort();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">
          📈 Bid Timeseries: {companyName}
        </h3>
        <div className="text-sm text-gray-500">
          Last Updated: {new Date(timeseriesData.lastUpdated || Date.now()).toLocaleString()}
        </div>
      </div>

      {/* SR. NO. Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedSrNo('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedSrNo === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📊 All Categories
        </button>
        {availableSrNos.map(srNo => (
          <button
            key={srNo}
            onClick={() => setSelectedSrNo(srNo)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedSrNo === srNo
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {srNo} - {SR_NO_TO_CATEGORY[srNo]?.split('(')[0] || `SR.${srNo}`}
          </button>
        ))}
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedSrNo === 'all' ? (
          // Show all categories
          dataEntries
            .filter(([_, data]) => Array.isArray(data) && data.length > 0)
            .sort(([a], [b]) => {
              // Sort by SR. NO. logically
              if (a === '-') return 1; // Total at end
              if (b === '-') return -1;
              return a.localeCompare(b, undefined, { numeric: true });
            })
            .map(([srNo, data]) => renderSrNoData(srNo, data as any[]))
        ) : (
          // Show selected category
          selectedSrNo !== 'all' && (() => {
            // Find the schema field for the selected SR. NO.
            const schemaField = Object.entries(FIELD_TO_SR_NO).find(([_, srNo]) => srNo === selectedSrNo)?.[0];
            if (!schemaField) {
              return (
                <div className="col-span-full text-gray-500 text-center py-8">
                  Schema field not found for SR.NO. {selectedSrNo}
                </div>
              );
            }
            
            const selectedData = (timeseriesData as any)[schemaField];
            if (!selectedData || !Array.isArray(selectedData) || selectedData.length === 0) {
              return (
                <div className="col-span-full text-gray-500 text-center py-8">
                  No data available for SR.NO. {selectedSrNo}
                </div>
              );
            }
            return renderSrNoData(selectedSrNo, selectedData);
          })()
        )}
      </div>

      {/* Raw Data Debug */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          🔍 Debug: View Raw Data Structure
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-x-auto max-h-64">
          {JSON.stringify(timeseriesData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default TimeseriesView;
