'use client';

import Link from 'next/link';
import { QueryEngine } from '@/components/query/QueryEngine';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <QueryEngine />
      {/* Links Section */}
      <div className="bg-query-box rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-black">Resources</h2>
        <ul className="space-y-3">
          <li>
          <Link href="/queries" className="text-black hover:text-gray-700 transition-colors">
            Account Intake
          </Link>
          </li>
          <li>
            <Link href="https://docs.mintbase.xyz/ai/mintbase-plugins" className="text-black hover:text-gray-700 transition-colors">
              Documentation
            </Link>
          </li>
          <li>
            <Link href="/.well-known/ai-plugin.json" className="text-black hover:text-gray-700 transition-colors">
              OpenAPI Spec
            </Link>
          </li>
          <li>
            <Link href="/api/swagger" className="text-black hover:text-gray-700 transition-colors">
              Swagger
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}