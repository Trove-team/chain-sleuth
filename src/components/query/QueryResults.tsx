// components/query/QueryResults.tsx
'use client';

import React from 'react';
import type { NFTMetadata } from '@/types/nft';

interface QueryResultsProps {
  queries: NFTMetadata[];
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(parseInt(timestamp) / 1_000_000);
    return date.toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

function parseMetadataExtra(metadata: any): {
  queried_name: string;
  investigator: string;
  transaction_count: number;
  near_balance: string;
  eth_address: string;
} {
  try {
    if (typeof metadata.extra === 'string') {
      const parsedExtra = JSON.parse(metadata.extra);
      const parsedData = parsedExtra.parsed_data?.parsed_fields || {};
      
      return {
        queried_name: parsedExtra.investigated_account || metadata.queried_name,
        investigator: parsedExtra.investigator || metadata.querier,
        transaction_count: parseInt(parsedData.transaction_count) || 0,
        near_balance: parsedData.near_balance || '0',
        eth_address: parsedData.eth_address || 'N/A'
      };
    }
  } catch (e) {
    console.error('Error parsing metadata extra:', e);
  }
  
  return {
    queried_name: metadata.queried_name,
    investigator: metadata.querier,
    transaction_count: 0,
    near_balance: '0',
    eth_address: 'N/A'
  };
}

export default function QueryResults({ queries }: QueryResultsProps) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Queried Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Querier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NEAR Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ETH Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Investigated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((query) => {
              const parsedData = parseMetadataExtra(query);
              return (
                <tr key={query.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {parsedData.queried_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {parsedData.investigator}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {query.reputation_score || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parsedData.transaction_count.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Ⓝ {parsedData.near_balance}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parsedData.eth_address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(query.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">Complete</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}