const { z } = require('zod');

const createBookingSchema = {
  body: z.object({
    showId: z.string().min(1, 'Show ID is required'),
    seatIds: z.array(z.string().min(1)).min(1, 'At least one seat must be selected').max(6, 'Maximum 6 seats per booking allowed'),
    customerDetails: z.object({
      name: z.string().min(2, 'Name is required'),
      email: z.string().email('Valid email is required'),
      phone: z.string().min(8, 'Valid phone number is required'),
    }).optional(),
  }),
};

const cancelBookingSchema = {
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
};

const processPaymentSchema = {
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'DEMO']).default('DEMO'),
    simulateOutcome: z.enum(['SUCCESS', 'FAILED', 'TIMEOUT']).optional().default('SUCCESS'),
  }),
};

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  processPaymentSchema,
};
