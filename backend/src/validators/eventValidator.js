const { z } = require('zod');

const createEventSchema = {
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(['Movies', 'Concerts', 'Sports', 'Theatre', 'Stand-up', 'Other Events']),
    location: z.string().min(2, 'Location is required'),
    venue_name: z.string().min(2, 'Venue name is required'),
    duration_mins: z.coerce.number().min(10).max(600).default(120),
    poster_url: z.string().url('Must be a valid image URL').optional(),
  }),
};

const createShowSchema = {
  body: z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    show_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid show date/time ISO string',
    }),
    format: z.enum(['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX', 'Live']).default('2D'),
    language: z.string().default('English'),
    base_price: z.coerce.number().min(50).max(50000),
    total_seats: z.coerce.number().min(10).max(500).default(50),
  }),
};

module.exports = {
  createEventSchema,
  createShowSchema,
};
