const { z } = require('zod');

const lockSeatsSchema = {
  params: z.object({
    showId: z.string().min(1, 'Show ID is required'),
  }),
  body: z.object({
    seatIds: z.array(z.string().min(1)).min(1, 'At least one seat must be selected').max(6, 'Maximum 6 seats can be locked at once'),
  }),
};

const releaseSeatsSchema = {
  params: z.object({
    showId: z.string().min(1, 'Show ID is required'),
  }),
  body: z.object({
    seatIds: z.array(z.string().min(1)).min(1),
  }),
};

module.exports = {
  lockSeatsSchema,
  releaseSeatsSchema,
};
