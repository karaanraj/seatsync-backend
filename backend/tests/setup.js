const { initDb, getMemoryDb } = require('../src/config/db');
const { initRedis, getRedisClient } = require('../src/config/redis');
const { seedDatabase } = require('../src/db/seed');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
  await initRedis();
  await seedDatabase();
});

afterAll(async () => {
  const redis = await getRedisClient();
  if (redis.quit) {
    await redis.quit();
  }
});
