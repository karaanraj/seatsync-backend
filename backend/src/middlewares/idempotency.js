const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const idempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    return next();
  }

  try {
    const redis = await getRedisClient();
    const cacheKey = `idemp:${idempotencyKey}`;
    const cachedResponse = await redis.get(cacheKey);

    if (cachedResponse) {
      logger.info(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
      const parsed = JSON.parse(cachedResponse);
      return res.status(parsed.status).set('X-Cache-Lookup', 'HIT').json(parsed.body);
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = JSON.stringify({
          status: res.statusCode,
          body,
        });
        // Cache idempotency response for 24 hours
        redis.set(cacheKey, payload, { EX: 86400 }).catch((err) => {
          logger.error(`[Idempotency] Failed to cache response: ${err.message}`);
        });
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.error(`[Idempotency] Middleware error: ${err.message}`);
    next();
  }
};

module.exports = idempotency;
