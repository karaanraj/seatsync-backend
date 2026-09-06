const { getRedisClient } = require('../config/redis');
const seatRepo = require('../repositories/seatRepo');
const showRepo = require('../repositories/showRepo');
const env = require('../config/env');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * High-concurrency Temporary Seat Locking Service powered by Redis TTL
 */
class SeatLockService {
  /**
   * Acquire temporary locks for specified seats with TTL (e.g. 600s)
   */
  static async lockSeats(showId, seatIds, userId) {
    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestError('No seats provided for locking.');
    }
    if (seatIds.length > env.MAX_SEATS_PER_BOOKING) {
      throw new BadRequestError(`Maximum ${env.MAX_SEATS_PER_BOOKING} seats can be locked at once.`);
    }

    const show = await showRepo.findById(showId);
    if (!show) {
      throw new NotFoundError('Show not found.');
    }

    // 1. Check persistent database state first
    const seats = await seatRepo.findByIds(showId, seatIds);
    if (seats.length !== seatIds.length) {
      throw new NotFoundError('One or more selected seats do not exist in this show.');
    }

    const alreadyBooked = seats.filter((s) => s.status === 'BOOKED');
    if (alreadyBooked.length > 0) {
      const numbers = alreadyBooked.map((s) => s.seat_number).join(', ');
      throw new ConflictError(
        `Seat(s) ${numbers} are already booked.`,
        'SEATS_ALREADY_BOOKED',
        { bookedSeatIds: alreadyBooked.map((s) => s.id) }
      );
    }

    const redis = await getRedisClient();
    const lockTtl = env.LOCK_TTL_SECONDS; // 600 seconds
    const successfullyLockedKeys = [];
    const conflictSeats = [];

    // 2. Atomic Redis lock attempts using SET key value NX EX ttl
    for (const seat of seats) {
      const lockKey = `seat-lock:${showId}:${seat.id}`;
      const existingHolder = await redis.get(lockKey);

      if (existingHolder) {
        if (existingHolder === userId) {
          // Already held by this exact user, extend or keep lock
          successfullyLockedKeys.push(lockKey);
          continue;
        } else {
          // Held by someone else! Race condition handled cleanly
          conflictSeats.push(seat.seat_number);
        }
      } else {
        // Attempt atomic acquisition
        const acquired = await redis.set(lockKey, userId, { NX: true, EX: lockTtl });
        if (acquired) {
          successfullyLockedKeys.push(lockKey);
        } else {
          conflictSeats.push(seat.seat_number);
        }
      }
    }

    // 3. If any seat suffered a collision, roll back acquired locks in this attempt
    if (conflictSeats.length > 0) {
      for (const key of successfullyLockedKeys) {
        // Only remove if locked by this user
        const holder = await redis.get(key);
        if (holder === userId) {
          await redis.del(key);
        }
      }
      logger.warn(`[SeatLock Conflict] User ${userId} conflicted on seats: ${conflictSeats.join(', ')}`);
      throw new ConflictError(
        `Sorry, seat(s) ${conflictSeats.join(', ')} were just held by another customer. Please choose alternative seats.`,
        'SEAT_HELD_BY_ANOTHER_USER',
        { conflictSeats }
      );
    }

    const expiresAt = new Date(Date.now() + lockTtl * 1000).toISOString();
    logger.info(`[SeatLock Acquired] User ${userId} locked ${seatIds.length} seat(s) on show ${showId} until ${expiresAt}`);

    return {
      showId,
      lockedSeatIds: seatIds,
      lockTtlSeconds: lockTtl,
      expiresAt,
    };
  }

  /**
   * Release temporary locks when user deselects seats
   */
  static async releaseSeats(showId, seatIds, userId) {
    const redis = await getRedisClient();
    let releasedCount = 0;

    for (const seatId of seatIds) {
      const lockKey = `seat-lock:${showId}:${seatId}`;
      const holder = await redis.get(lockKey);
      if (holder === userId) {
        await redis.del(lockKey);
        releasedCount++;
      }
    }

    logger.info(`[SeatLock Released] User ${userId} released ${releasedCount} seat(s) on show ${showId}`);
    return { releasedCount };
  }

  /**
   * Fetch full seating layout merged with live Redis locks
   */
  static async getShowSeatsWithLockStatus(showId, currentUserId = null) {
    const show = await showRepo.findById(showId);
    if (!show) {
      throw new NotFoundError('Show not found.');
    }

    const seats = await seatRepo.findByShowId(showId);
    const redis = await getRedisClient();

    const mergedSeats = await Promise.all(
      seats.map(async (seat) => {
        if (seat.status === 'BOOKED') {
          return {
            ...seat,
            lockStatus: 'BOOKED',
            isSelectable: false,
          };
        }

        const lockKey = `seat-lock:${showId}:${seat.id}`;
        const holder = await redis.get(lockKey);

        if (holder) {
          const isCurrentUser = currentUserId && holder === currentUserId;
          const ttlRemaining = await redis.ttl(lockKey);

          return {
            ...seat,
            lockStatus: isCurrentUser ? 'LOCKED_BY_CURRENT_USER' : 'LOCKED_BY_OTHER',
            isSelectable: Boolean(isCurrentUser),
            lockTtlSeconds: ttlRemaining > 0 ? ttlRemaining : 0,
          };
        }

        return {
          ...seat,
          lockStatus: 'AVAILABLE',
          isSelectable: true,
        };
      })
    );

    return {
      show,
      seats: mergedSeats,
    };
  }
}

module.exports = SeatLockService;
