import neo4j, { Driver, SessionConfig } from 'neo4j-driver';

const driver: Driver = neo4j.driver(
  process.env.NEO4J_URI || '',
  neo4j.auth.basic(
    process.env.NEO4J_USER || '',
    process.env.NEO4J_PASSWORD || ''
  ),
  { 
    database: process.env.NEO4J_DATABASE || 'neo4j',
    encrypted: process.env.NEO4J_URI?.startsWith('bolt+s') || undefined
  } as SessionConfig
);

export const runQuery = async (query: string, params = {}) => {
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
  return driver.close();
};
