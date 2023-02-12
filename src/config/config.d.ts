declare global {
  namespace NodeJS {
    interface Global {
      io: any;
    }
    interface ProcessEnv {
      // Environment
      NODE_ENV: string;

      // MongoDB
      MONGODB_CONN_STRING: string;

      // Redis
      REDIS_HOST: string;
      REDIS_PORT: string;

      // JWT
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_SECRET: string;
      JWT_REFRESH_EXPIRES_IN: string;

      // Swagger UI
      SWAGGER_UI_ENABLED: string;
      SWAGGER_UI_USERNAME: string;
      SWAGGER_UI_PASSWORD: string;
      SWAGGER_UI_SERVER_PREFIX: string;
    }
  }
}

export {};
