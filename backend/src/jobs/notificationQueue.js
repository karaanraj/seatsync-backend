const { getMemoryDb, isUsingMemoryStore, query } = require('../config/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Event-driven async background worker for booking confirmations & notifications
class NotificationQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
  }

  async add(name, data) {
    const job = {
      id: uuidv4(),
      name,
      data,
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
    };
    this.jobs.push(job);
    logger.info(`[NotificationQueue] Job added: ${name} (${job.id}) for user ${data.recipientEmail}`);

    // Trigger asynchronous queue processor
    setImmediate(() => this.process());
    return job;
  }

  async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      try {
        job.status = 'PROCESSING';
        logger.info(`[NotificationWorker] Processing job: ${job.name} (${job.id})...`);

        // Simulate notification delivery latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const memoryDb = getMemoryDb();
        const notificationRecord = {
          id: job.id,
          user_id: job.data.userId,
          booking_id: job.data.bookingId,
          type: job.name,
          recipient_email: job.data.recipientEmail,
          message: job.data.message,
          status: 'SENT',
          sent_at: new Date().toISOString(),
          created_at: job.createdAt,
        };

        if (isUsingMemoryStore()) {
          memoryDb.notifications.push(notificationRecord);
        } else {
          try {
            await query(
              `INSERT INTO notifications (id, user_id, booking_id, type, recipient_email, message, status, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6, 'SENT', NOW())`,
              [notificationRecord.id, notificationRecord.user_id, notificationRecord.booking_id, notificationRecord.type, notificationRecord.recipient_email, notificationRecord.message]
            );
          } catch (dbErr) {
            logger.warn(`[NotificationWorker] Could not insert to DB: ${dbErr.message}`);
          }
        }

        job.status = 'COMPLETED';
        logger.info(`[NotificationWorker] Email sent to ${job.data.recipientEmail}: "${job.data.message}"`);
      } catch (err) {
        job.status = 'FAILED';
        logger.error(`[NotificationWorker] Job ${job.id} failed: ${err.message}`);
      }
    }

    this.isProcessing = false;
  }
}

const notificationQueue = new NotificationQueue();

module.exports = notificationQueue;
