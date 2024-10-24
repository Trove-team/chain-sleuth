// components/query/QueryResults.tsx
'use client';

import React from 'react';
import type { NFTMetadata } from '@/types/nft';

interface QueryResultsProps {
  queries: NFTMetadata[];
}

interface InvestigationData {
  subject_account: string;
  investigator: string;
  creation_date: number;
  last_updated: number;
  transaction_count: number;
  total_usd_value: number;
  defi_value: number;
  near_balance: number;
  reputation_score: number | null;
  eth_address: string;
  summary: string;
}

function formatDate(timestamp: string | number): string {
  try {
    // Handle nanosecond timestamps from NEAR
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(timestampNum / 1_000_000).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

function parseMetadataExtra(metadata: any): InvestigationData {
  try {
    if (typeof metadata.extra === 'string') {
      const parsedExtra = JSON.parse(metadata.extra);
      // Get investigation data from the metadata
      return {
        subject_account: parsedExtra.investigated_account || '',
        investigator: parsedExtra.investigator || '',
        creation_date: parsedExtra.investigation_date || 0,
        last_updated: parsedExtra.investigation_date || 0,
        transaction_count: Number(parsedExtra.parsed_data?.parsed_fields?.transaction_count || 0),
        total_usd_value: Number(parsedExtra.parsed_data?.parsed_fields?.total_usd_value || 0),
        defi_value: Number(parsedExtra.parsed_data?.parsed_fields?.defi_value || 0),
        near_balance: Number(parsedExtra.parsed_data?.parsed_fields?.near_balance || 0),
        reputation_score: parsedExtra.parsed_data?.parsed_fields?.reputation_score || null,
        eth_address: parsedExtra.parsed_data?.parsed_fields?.eth_address || 'N/A',
        summary: parsedExtra.summaries?.short_summary || ''
      };
    }
  } catch (e) {
    console.error('Error parsing metadata extra:', e);
  }
  
  return {
    subject_account: '',
    investigator: '',
    creation_date: 0,
    last_updated: 0,
    transaction_count: 0,
    total_usd_value: 0,
    defi_value: 0,
    near_balance: 0,
    reputation_score: null,
    eth_address: 'N/A',
    summary: ''
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
                      {parsedData.subject_account}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {parsedData.investigator}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parsedData.reputation_score || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parsedData.transaction_count.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Ⓝ {parsedData.near_balance.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono text-xs">
                      {parsedData.eth_address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(parsedData.creation_date)}
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