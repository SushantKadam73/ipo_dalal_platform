import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';

interface TimeSeriesDataPoint {
  value: string;
  timestamp: number;
}

interface CategoryData {
  category: string;
  srNo: string;
  noOfSharesBidSeries: TimeSeriesDataPoint[];
  noOfTotalMeantSeries: TimeSeriesDataPoint[];
  noofapplicationSeries?: TimeSeriesDataPoint[];
}

interface SubscriptionTimeSeriesChartProps {
  timeSeriesData: CategoryData[];
  symbol: string;
  companyName?: string;
  type?: 'EQ' | 'SME';
}

export function SubscriptionTimeSeriesChart({
  timeSeriesData,
  symbol,
  companyName,
  type = 'EQ'
}: SubscriptionTimeSeriesChartProps) {
  // Find the "Total" category data for overall subscription
  const totalCategoryData = useMemo(() => {
    return timeSeriesData.find(data => 
      data.category.toLowerCase().includes('total') || 
      data.srNo === '0'
    );
  }, [timeSeriesData]);

  // Process data for the total subscription time series chart
  const subscriptionTimeSeriesData = useMemo(() => {
    if (!totalCategoryData) return [];

    const sharesBidData = totalCategoryData.noOfSharesBidSeries || [];
    const totalMeantData = totalCategoryData.noOfTotalMeantSeries || [];

    // Create a combined dataset with timestamps
    const timeMap = new Map();

    sharesBidData.forEach(point => {
      const key = point.timestamp;
      if (!timeMap.has(key)) {
        timeMap.set(key, { timestamp: key, time: new Date(key) });
      }
      timeMap.get(key).sharesBid = parseFloat(point.value) || 0;
    });

    totalMeantData.forEach(point => {
      const key = point.timestamp;
      if (!timeMap.has(key)) {
        timeMap.set(key, { timestamp: key, time: new Date(key) });
      }
      timeMap.get(key).subscription = parseFloat(point.value) || 0;
    });

    // Convert to array and sort by timestamp
    const combinedData = Array.from(timeMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((point, index) => ({
        ...point,
        timeLabel: point.time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        dateLabel: point.time.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        index,
      }));

    return combinedData;
  }, [totalCategoryData]);

  // Process data for category-wise subscription comparison
  const categoryComparisonData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];

    // Get the latest subscription values for each category
    const latestData = timeSeriesData
      .filter(data => !data.category.toLowerCase().includes('total'))
      .map(data => {
        const latestSubscription = data.noOfTotalMeantSeries.length > 0 
          ? parseFloat(data.noOfTotalMeantSeries[data.noOfTotalMeantSeries.length - 1].value) || 0
          : 0;
        
        const latestSharesBid = data.noOfSharesBidSeries.length > 0 
          ? parseFloat(data.noOfSharesBidSeries[data.noOfSharesBidSeries.length - 1].value) || 0
          : 0;

        return {
          category: data.category.replace(/\([^)]*\)/g, '').trim(),
          subscription: latestSubscription,
          sharesBid: latestSharesBid,
          srNo: data.srNo,
        };
      })
      .sort((a, b) => b.subscription - a.subscription)
      .slice(0, 8); // Top 8 categories

    return latestData;
  }, [timeSeriesData]);

  // Process historical comparison data (last 10 data points)
  const historicalComparisonData = useMemo(() => {
    if (!totalCategoryData || totalCategoryData.noOfTotalMeantSeries.length < 2) return [];

    const subscriptionData = totalCategoryData.noOfTotalMeantSeries;
    const recentData = subscriptionData.slice(-10).map((point, index) => ({
      index: index + 1,
      subscription: parseFloat(point.value) || 0,
      time: new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: point.timestamp,
    }));

    return recentData;
  }, [totalCategoryData]);

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Subscription Time Series - {symbol}
        </h3>
        <div className="text-center py-8 text-gray-500">
          No time series data available
        </div>
      </div>
    );
  }

  const formatTooltipValue = (value: any, name: string) => {
    if (name === 'subscription') {
      return [`${value.toFixed(2)}x`, 'Subscription'];
    }
    if (name === 'sharesBid') {
      return [value.toLocaleString(), 'Shares Bid'];
    }
    return [value, name];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Total Subscription Over Time - {symbol}
          {companyName && <span className="text-sm text-gray-600 block">{companyName}</span>}
        </h3>
        
        {subscriptionTimeSeriesData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={subscriptionTimeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="timeLabel"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="subscription"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Subscription (x)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="shares"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Shares Bid', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.dateLabel} ${data.timeLabel}`;
                    }
                    return label;
                  }}
                  formatter={formatTooltipValue}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Legend />
                <Line
                  yAxisId="subscription"
                  type="monotone"
                  dataKey="subscription"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                  name="Total Subscription"
                />
                <Bar
                  yAxisId="shares"
                  dataKey="sharesBid"
                  fill="#10b981"
                  opacity={0.7}
                  name="Shares Bid"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No total subscription data available
          </div>
        )}
      </div>

      {/* Category-wise Current Subscription */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Subscription by Category
        </h3>
        
        {categoryComparisonData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={categoryComparisonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Subscription (x)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${(typeof value === 'number' ? value : parseFloat(value as string) || 0).toFixed(2)}x`, 'Subscription']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Area
                  type="monotone"
                  dataKey="subscription"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No category data available
          </div>
        )}
      </div>

      {/* Recent Subscription Trend */}
      {historicalComparisonData.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Subscription Trend (Last 10 Updates)
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalComparisonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Subscription (x)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${(typeof value === 'number' ? value : parseFloat(value as string) || 0).toFixed(2)}x`, 'Subscription']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `Update ${data.index} - ${data.time}`;
                    }
                    return label;
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Area
                  type="monotone"
                  dataKey="subscription"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subscription Metrics Summary */}
      {subscriptionTimeSeriesData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Subscription Metrics Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {subscriptionTimeSeriesData[subscriptionTimeSeriesData.length - 1]?.subscription.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-600">Current Subscription</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...subscriptionTimeSeriesData.map(d => d.subscription)).toFixed(2)}x
              </div>
              <div className="text-sm text-gray-600">Peak Subscription</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {subscriptionTimeSeriesData.length}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {subscriptionTimeSeriesData.length > 1 
                  ? ((subscriptionTimeSeriesData[subscriptionTimeSeriesData.length - 1]?.subscription - 
                      subscriptionTimeSeriesData[subscriptionTimeSeriesData.length - 2]?.subscription) || 0).toFixed(2)
                  : '0.00'
                }x
              </div>
              <div className="text-sm text-gray-600">Last Change</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
