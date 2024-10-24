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
    return 'N/A';
  }
}

function parseMetadataExtra(metadata: any) {
  try {
    const extraData = typeof metadata.extra === 'string' 
      ? JSON.parse(metadata.extra) 
      : metadata.extra;

    const fields = extraData?.parsed_data?.parsed_fields || {};
    
    return {
      queried_name: extraData.investigated_account || 'N/A',
      investigator: extraData.investigator || 'N/A',
      transaction_count: fields.transaction_count || '0',
      near_balance: fields.near_balance || '0',
      eth_address: fields.eth_address || 'N/A',
      date: extraData.investigation_date || 'N/A'
    };
  } catch (e) {
    return {
      queried_name: 'N/A',
      investigator: 'N/A',
      transaction_count: '0',
      near_balance: '0',
      eth_address: 'N/A',
      date: 'N/A'
    };
  }
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
            {queries.map((query, index) => {
              const parsedData = parseMetadataExtra(query);
              return (
                <tr key={index} className="hover:bg-gray-50">
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
                      {parsedData.transaction_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parsedData.near_balance}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {parsedData.eth_address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(parsedData.date)}
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