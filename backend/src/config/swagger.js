const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SeatSync API Documentation',
    version: '1.0.0',
    description: `
SeatSync is a high-concurrency ticket booking engine designed to solve race conditions and double booking problems.

### Core Concurrency Mechanisms:
- **Redis Distributed Temporary Seat Locks**: Temporary 10-minute hold (\`SET NX EX 600\`)
- **PostgreSQL Row-Level Locking**: \`SELECT ... FOR UPDATE\` within atomic transaction boundaries
- **Idempotency**: \`Idempotency-Key\` header ensures safe retries without duplicate charges
- **Rate Limiting**: Fair access to hot show booking endpoints
    `,
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'API Health Check',
        responses: {
          200: { description: 'Service is operational' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane@seatsync.com' },
                  password: { type: 'string', example: 'Password@123' },
                  role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered and JWT token returned' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'user@seatsync.com' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/events': {
      get: {
        summary: 'List active events with filters and search',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['popular', 'price_low', 'price_high'] } },
        ],
        responses: {
          200: { description: 'List of events' },
        },
      },
    },
    '/api/shows/{showId}/seats': {
      get: {
        summary: 'Get seat map with real-time Redis lock states and countdowns',
        parameters: [{ name: 'showId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Seating layout with locked, available, and booked statuses' },
        },
      },
    },
    '/api/shows/{showId}/seats/lock': {
      post: {
        summary: 'Acquire temporary Redis lock on seats (10m TTL)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'showId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['seatIds'],
                properties: {
                  seatIds: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Seats locked successfully' },
          409: { description: 'Seat held by another customer' },
        },
      },
    },
    '/api/bookings': {
      post: {
        summary: 'Create booking with atomic PostgreSQL transaction & row-level locking',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            schema: { type: 'string' },
            description: 'Unique UUID to prevent duplicate charges/bookings on network retry',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['showId', 'seatIds'],
                properties: {
                  showId: { type: 'string' },
                  seatIds: { type: 'array', items: { type: 'string' } },
                  customerDetails: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking created with status PENDING' },
          409: { description: 'Seat conflict / race condition rejected' },
        },
      },
    },
    '/api/payments': {
      post: {
        summary: 'Process simulated payment',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId'],
                properties: {
                  bookingId: { type: 'string', example: 'SS-2026-102931' },
                  paymentMethod: { type: 'string', enum: ['UPI', 'CARD', 'NET_BANKING', 'DEMO'], default: 'DEMO' },
                  simulateOutcome: { type: 'string', enum: ['SUCCESS', 'FAILED', 'TIMEOUT'], default: 'SUCCESS' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment recorded and booking status transitioned' },
        },
      },
    },
    '/api/concurrency/simulate-race': {
      post: {
        summary: 'Interactive race condition battle between 3 simultaneous users on Seat A10',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  seatNumber: { type: 'string', default: 'A10' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Concurrency simulation diagnostic metrics' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = setupSwagger;
