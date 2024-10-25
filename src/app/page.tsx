// app/page.tsx
'use client';

import QueryInput from '@/components/query/QueryInput';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Chain Sleuth Agent</h1>
      <QueryInput />
    </div>
  );
}
