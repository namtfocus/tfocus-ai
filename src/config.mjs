const requiredServiceToken = process.env.TFOCUS_SERVICE_TOKEN;

export const config = Object.freeze({
  host: process.env.TFOCUS_API_HOST ?? "127.0.0.1",
  port: Number(process.env.TFOCUS_API_PORT ?? 4100),
  mode: process.env.TFOCUS_MODE ?? "ASSIST",
  databaseUrl: process.env.TFOCUS_DATABASE_URL ?? "postgresql://chatbotx:secretkey@127.0.0.1:5432/chatbotx",
  redisUrl: process.env.TFOCUS_REDIS_URL ?? "redis://127.0.0.1:6379",
  serviceToken: requiredServiceToken ?? "local-tfocus-service-token-change-me",
  nodeEnv: process.env.NODE_ENV ?? "development"
});
