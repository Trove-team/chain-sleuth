declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEAR_NETWORK_ID: string;
            NEAR_CONTRACT_ID: string;
            REDIS_URL?: string;
            REDIS_HOST?: string;
            REDIS_PORT?: string;
            REDIS_PASSWORD?: string;
            REDIS_ENV?: 'development' | 'production';
            UPSTASH_REDIS_URL?: string;
            NEO4J_API_KEY: string;
            NEO4J_API_URL: string;
        }
    }
}

export {};