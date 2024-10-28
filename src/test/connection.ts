// src/tests/connection.ts
import { makeNeo4jRequest } from '../utils/auth';

async function testConnection() {
  try {
    // Assuming he has a health check endpoint
    const result = await makeNeo4jRequest('/health');
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();