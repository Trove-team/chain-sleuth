import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-4">Chain Sleuth Agent</h1>
      <ul className="space-y-2">
        <li>
          <Link href="https://docs.mintbase.xyz/ai/mintbase-plugins" className="text-blue-600 hover:underline">
            Docs
          </Link>
        </li>
        <li>
          <Link href="/.well-known/ai-plugin.json" className="text-blue-600 hover:underline">
            OpenAPI Spec
          </Link>
        </li>
        <li>
          <Link href="/api/swagger" className="text-blue-600 hover:underline">
            Swagger
          </Link>
        </li>
        <li>
          <Link href="https://github.com/Trove-team/chain-sleuth" className="text-blue-600 hover:underline">
            Source Code
          </Link>
        </li>
      </ul>
    </Layout>
  );
}
