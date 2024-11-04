// components/query/QueryResults.tsx
import React from 'react';
import type { QueryResult } from '@/types/pipeline';

interface QueryResultsProps {
  queries: QueryResult[];
}

export default function QueryResults({ queries }: QueryResultsProps) {
  const generateNearExplorerLink = (accountId: string) => 
    `https://explorer.testnet.near.org/accounts/${accountId}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'Processing':
        return 'bg-yellow-500';
      case 'Failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  console.log('Rendering QueryResults with:', queries);

  if (!queries || queries.length === 0) {
    return (
      <div className="bg-query-box rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 text-black">Query Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NEAR Balance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total USD Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DeFi Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bot Detection
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No query results available yet. Start a query to see results here.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-query-box rounded-lg overflow-hidden">
      <h2 className="text-xl font-semibold p-6 text-black">Query Results</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NEAR Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total USD Value
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DeFi Value
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bot Detection
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((query, index) => (
              <tr key={`${query.accountId}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a 
                    href={generateNearExplorerLink(query.accountId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {query.accountId}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {parseFloat(query.financialSummary.nearBalance).toFixed(2)} NEAR
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${query.financialSummary.totalUsdValue.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${query.financialSummary.defiValue.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    query.analysis.isBot ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {query.analysis.isBot ? 'Bot' : 'Human'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(query.status)}`} />
                    <span className="text-sm text-gray-700">{query.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Analysis Section */}
        {queries.length > 0 && (queries[0].analysis.robustSummary || queries[0].analysis.shortSummary) && (
          <div className="p-6 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Latest Analysis Results</h3>
            
            {queries[0].analysis.shortSummary && (
              <div className="bg-[#f1e9dd] p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Quick Summary</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {queries[0].analysis.shortSummary}
                </p>
              </div>
            )}
            
            {queries[0].analysis.robustSummary && (
              <div className="bg-[#f1e9dd] p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detailed Analysis</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {queries[0].analysis.robustSummary}
                </p>
              </div>
            )}

            <div className="bg-[#f1e9dd] p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Transaction Activity</h4>
              <p className="text-sm text-gray-600">
                Total Transactions: {queries[0].analysis.transactionCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
