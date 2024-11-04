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
    switch (status.toLowerCase()) {
      case 'complete':
      case 'exists':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  console.log('Rendering QueryResults with:', queries);
  console.log('QueryResults rendered with:', queries);

  if (!queries || queries.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg">
        <p className="text-gray-500">No query results available yet. Start a query to see results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NEAR Balance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DeFi Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {queries.map((query, index) => (
            <tr key={`${query.accountId}-${query.timestamp}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.accountId}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${query.financialSummary.totalUsdValue.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {query.financialSummary.nearBalance} NEAR
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${query.financialSummary.defiValue.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={query.status} />
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Quick Summary</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {queries[0].analysis.shortSummary}
              </p>
            </div>
          )}
          
          {queries[0].analysis.robustSummary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Detailed Analysis</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {queries[0].analysis.robustSummary}
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Transaction Activity</h4>
            <p className="text-sm text-gray-600">
              Total Transactions: {queries[0].analysis.transactionCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)} text-white`}>
      {status}
    </span>
  );
}
