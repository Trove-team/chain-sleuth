// app/page.tsx
'use client';

import Link from 'next/link';
import QueryInput from '@/components/query/QueryInput';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-200">Chain Sleuth Agent</h1>
      <QueryInput />

      {/* Links Section */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-300">Resources</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/queries" className="text-gray-300 hover:text-white">
              View All Queries
            </Link>
          </li>
          <li>
            <Link href="https://docs.mintbase.xyz/ai/mintbase-plugins" className="text-gray-300 hover:text-white">
              Documentation
            </Link>
          </li>
          <li>
            <Link href="/.well-known/ai-plugin.json" className="text-gray-300 hover:text-white">
              OpenAPI Spec
            </Link>
          </li>
          <li>
            <Link href="/api/swagger" className="text-gray-300 hover:text-white">
              Swagger
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
