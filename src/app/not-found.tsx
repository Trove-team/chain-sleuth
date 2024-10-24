// app/not-found.tsx
'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-4">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link 
          href="/" 
          className="text-blue-600 hover:underline"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}