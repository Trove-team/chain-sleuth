import neo4j, { Driver, SessionConfig } from 'neo4j-driver';

const driver: Driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
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
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
};

export const closeDriver = () => {
  return driver.close();
};
