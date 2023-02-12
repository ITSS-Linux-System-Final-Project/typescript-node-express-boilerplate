import { createNodeRedisClient } from 'handy-redis';

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.REDIS_PORT || '6379', 10) || 6379;

export const redisClient = createNodeRedisClient({
  host,
  port,
});

redisClient.nodeRedis.on('error', () => {
  console.log('Redis connection error.');
});

redisClient.nodeRedis.on('connect', () => {
  console.log(`Redis client connected on port ${port}!`);
});
