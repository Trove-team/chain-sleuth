import neo4j, { Driver, SessionConfig } from 'neo4j-driver';

console.log("Neo4j URI:", process.env.NEO4J_URI);
console.log("Neo4j User:", process.env.NEO4J_USER);
console.log("Neo4j Password:", process.env.NEO4J_PASSWORD ? '[REDACTED]' : 'undefined');
console.log("Neo4j Database:", process.env.NEO4J_DATABASE);

let driver: Driver;

try {
  driver = neo4j.driver(
    process.env.NEO4J_URI || '',
    neo4j.auth.basic(
      process.env.NEO4J_USER || '',
      process.env.NEO4J_PASSWORD || ''
    ),
    { 
      database: process.env.NEO4J_DATABASE || 'neo4j'
    } as SessionConfig
  );

  console.log('Driver created successfully');
} catch (error) {
  console.error('Error creating Neo4j driver:', error);
  throw error;
}

// Test connection immediately
(async () => {
  try {
    await driver.verifyConnectivity();
    console.log('Successfully connected to Neo4j');
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
  }
})();

export const runQuery = async (query: string, params = {}) => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  const session = driver.session({
    database: process.env.NEO4J_DATABASE || 'neo4j'
  });
  try {
    console.log('Executing query:', query, 'with params:', params);
    const result = await session.run(query, params);
    console.log('Query result:', result.records);
    return result.records;
  } catch (error) {
    console.error('Error executing Neo4j query:', error);
    throw error;
  } finally {
    await session.close();
  }
};

export const closeDriver = () => {
  return driver?.close();
};

