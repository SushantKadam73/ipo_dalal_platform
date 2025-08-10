import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface SubscriptionChartsProps {
  bidDetails: any[];
  companyName: string;
  symbol: string;
}

export function SubscriptionCharts({ bidDetails, companyName, symbol }: SubscriptionChartsProps) {
  // Process data for charts
  const processDataForCharts = () => {
    if (!bidDetails || bidDetails.length === 0) return { categoryData: [], totalData: null };

    // Find total category
    const totalCategory = bidDetails.find(detail => 
      detail.category === "Total" || detail.srNo === null || detail.srNo === "0"
    );

    // Get main categories (excluding sub-categories and total)
    const mainCategories = bidDetails.filter(detail => 
      detail.category !== "Total" && 
      detail.srNo !== null && 
      detail.srNo !== "0" &&
      !detail.srNo?.includes("(") &&
      !detail.srNo?.includes(".")
    );

    const categoryData = mainCategories.map(detail => {
      const offered = Number(detail.noOfShareOffered) || 0;
      const bid = Number(detail.noOfSharesBid) || 0;
      const subscription = offered > 0 ? bid / offered : 0;
      
      return {
        name: detail.category,
        srNo: detail.srNo,
        offered: offered,
        bid: bid,
        subscription: subscription,
        subscriptionDisplay: `${subscription.toFixed(2)}x`,
        subscriptionPercent: subscription * 100,
      };
    });

    const totalData = totalCategory ? {
      offered: Number(totalCategory.noOfShareOffered) || 0,
      bid: Number(totalCategory.noOfSharesBid) || 0,
      subscription: Number(totalCategory.noOfTotalMeant) || 0,
    } : null;

    return { categoryData, totalData };
  };

  const { categoryData, totalData } = processDataForCharts();

  if (!categoryData.length && !totalData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No subscription data available for charting
      </div>
    );
  }

  // Color scheme for charts
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name === 'Subscription' 
                  ? `${entry.value.toFixed(2)}x`
                  : entry.value.toLocaleString()
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatTickNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Analysis - {companyName}
        </h2>
        <p className="text-gray-600">Category-wise subscription visualization</p>
        
        {/* Overall Subscription Summary */}
        {totalData && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Shares Offered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalData.offered.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Shares Bid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalData.bid.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Overall Subscription</p>
                <p className={`text-3xl font-bold ${
                  totalData.subscription > 1 ? 'text-green-600' : 
                  totalData.subscription > 0.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {totalData.subscription.toFixed(2)}x
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subscription Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category-wise Subscription Levels
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={categoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Subscription (x)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value}x`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="subscription" 
                name="Subscription"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shares Offered vs Bid Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Shares Offered vs Shares Bid
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={categoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Number of Shares', angle: -90, position: 'insideLeft' }}
                tickFormatter={formatTickNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="offered" 
                name="Offered"
                fill="#10B981" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="bid" 
                name="Bid"
                fill="#3B82F6" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bid Distribution by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData.filter(item => item.bid > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="bid"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Shares Bid']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Heatmap */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Subscription Status Overview
          </h3>
          <div className="space-y-3">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">
                  {category.name}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          category.subscription >= 1 
                            ? 'bg-gradient-to-r from-green-400 to-green-600' 
                            : category.subscription >= 0.5 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ 
                          width: `${Math.min(category.subscription * 100, 100)}%` 
                        }}
                      />
                      {category.subscription > 1 && (
                        <div 
                          className="absolute top-0 h-full bg-gradient-to-r from-green-600 to-green-800 opacity-60"
                          style={{ 
                            left: '100%',
                            width: `${Math.min((category.subscription - 1) * 50, 100)}%`
                          }}
                        />
                      )}
                    </div>
                    <div className={`text-sm font-bold min-w-16 text-right ${
                      category.subscription >= 1 ? 'text-green-600' :
                      category.subscription >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {category.subscriptionDisplay}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Detailed Subscription Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.offered.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.bid.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold ${
                    category.subscription >= 1 ? 'text-green-600' :
                    category.subscription >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {category.subscriptionDisplay}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.subscription >= 1 
                        ? 'bg-green-100 text-green-800' :
                      category.subscription >= 0.5 
                        ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                    }`}>
                      {category.subscription >= 1 ? 'Oversubscribed' :
                       category.subscription >= 0.5 ? 'Partially Filled' : 'Undersubscribed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
