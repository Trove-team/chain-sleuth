declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEAR_NETWORK_ID: string;
            NEAR_CONTRACT_ID: string;
            REDIS_URL?: string;
            NEO4J_API_KEY: string;
            NEO4J_API_URL: string;
        }
    }
}

export {};