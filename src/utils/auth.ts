// src/utils/auth.ts
import jwt from 'jsonwebtoken';

export function generateNeo4jToken() {
  if (!process.env.NEO4J_JWT_SECRET) {
    throw new Error('NEO4J_JWT_SECRET is not configured');
  }

  // Generate token with same structure his service expects
  return jwt.sign(
    {
      // Add any required claims his service expects
      app: 'chain-sleuth',
      iat: Date.now() / 1000,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    },
    process.env.NEO4J_JWT_SECRET
  );
}

// Helper to make authenticated requests
export async function makeNeo4jRequest(endpoint: string, options: RequestInit = {}) {
  const token = generateNeo4jToken();
  
  const response = await fetch(`${process.env.NEO4J_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'X-API-Key': process.env.NEO4J_API_KEY!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Neo4j API error: ${response.statusText}`);
  }

  return response.json();
}