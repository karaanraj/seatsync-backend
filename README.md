# SeatSync — High-Concurrency Ticket Booking Engine

> **Tagline**: *"Book your seat. Secure your spot."*  
> **Engineering Motto**: *"One seat. One winner."*

SeatSync is a production-grade full-stack ticket booking platform designed specifically to solve the distributed systems problem of **concurrent booking conflicts, race conditions, and double booking** when thousands of users compete for the exact same seat simultaneously.

---

## 🎯 The Core Problem: Race Conditions in Ticket Booking

Imagine a cinema or stadium where only one seat remains: **Seat A10**.

At the exact same millisecond:
1. **User A** sees Seat A10 available and clicks **"Book"**.
2. **User B** sees Seat A10 available and clicks **"Book"**.

A naive CRUD backend would query:
```sql
SELECT status FROM seats WHERE id = 'A10'; -- Returns 'AVAILABLE' for both users
```
Both incoming HTTP threads conclude the seat is available and proceed to insert two separate booking records for Seat A10.

### The Consequences:
- **Double Booking**: Two users arrive at the venue with valid paid tickets for the same physical seat.
- **Inconsistent Database State**: Inventory counts fall below zero or orphan records are created.
- **Payment Conflicts**: Both users are charged, requiring manual disputes and chargeback fees.

---

## 🛡️ SeatSync Architectural Solution: Defense-in-Depth Concurrency

SeatSync implements a **Two-Phase Concurrency Protection Architecture**:

```
[ Incoming Simultaneous Requests ]
  │
  ├── User 1 ─────┐
  ├── User 2 ─────┼───▶ [ Express API Gateway + Rate Limiter ]
  └── User 3 ─────┘
                            │
                            ▼
      [ Phase 1: Redis Distributed Temporary Lock ]
      SET seat-lock:show123:A10 user_1 NX EX 600
        ├── User 1 ──▶ Lock Acquired (10m TTL Countdown Started)
        ├── User 2 ──▶ 409 Conflict: "Seat held by another customer"
        └── User 3 ──▶ 409 Conflict: "Seat held by another customer"
                            │
                            ▼
      [ Phase 2: PostgreSQL ACID Transaction & Row Lock ]
      BEGIN;
      SELECT * FROM seats WHERE id = 'A10' FOR UPDATE;
      -- Verifies server-side authoritative price and status
      INSERT INTO bookings (...);
      INSERT INTO booking_items (...);
      UPDATE seats SET status = 'BOOKED';
      COMMIT;
                            │
                            ▼
      [ Asynchronous Notification Worker ]
      BullMQ / Redis Worker sends simulated ticket confirmation
```

### 1. Redis Distributed Temporary Seat Locks (Phase 1)
- When a user clicks a seat on the frontend seating map, the backend executes an atomic Redis command:
  ```bash
  SET seat-lock:<showId>:<seatId> <userId> NX EX 600
  ```
- **`NX` (Not Exists)**: Lock is only granted if no other user currently holds the key.
- **`EX 600` (TTL)**: The lock automatically expires after 10 minutes. If the user closes their browser or abandons the tab, the seat becomes available immediately without requiring cleanup cron jobs.
- **Zero Stale Client Trust**: The frontend timer is merely a visual indicator; expiration is strictly enforced by Redis TTL.

### 2. PostgreSQL Row-Level Pessimistic Locking (Phase 2)
- Optimistic locking (`WHERE version = x`) causes massive retry storms and aborted transactions during flash sales.
- SeatSync uses **pessimistic row-level locking**:
  ```sql
  SELECT id, seat_number, price, status 
  FROM seats 
  WHERE show_id = $1 AND id IN ($2) 
  FOR UPDATE;
  ```
- This locks only the specific seat rows involved in the transaction until `COMMIT` or `ROLLBACK`, guaranteeing complete serialized isolation.

### 3. API Idempotency Keys
- Prevents duplicate booking creation and double charges on network retries or accidental double-clicks.
- Clients send a unique header: `Idempotency-Key: <UUID>`.
- The idempotency middleware caches successful 2xx responses in Redis for 24 hours and immediately returns the cached booking on retries.

### 4. Authoritative Server-Side Pricing
- Client-provided prices are never trusted. Total costs, convenience fees (5%), and taxes (18% GST) are strictly computed server-side from immutable database rates.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL 16 (Raw parameterized SQL with `SELECT ... FOR UPDATE`) |
| **Caching / Locks** | Redis 7 (`SET NX EX`, TTL seat hold engine) |
| **Background Queue** | BullMQ / Redis-backed notification worker |
| **Authentication** | JWT (JSON Web Tokens), BCrypt password hashing |
| **Validation** | Zod schema validation |
| **Security** | Helmet, CORS, Rate Limiting (`express-rate-limit`) |
| **Documentation** | Swagger / OpenAPI 3.0 UI (`/api/docs`) |
| **Testing** | Supertest, Integration test runner (`tests/runTests.js`) |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quickstart Guide

SeatSync is designed to run seamlessly in two modes:
1. **Standalone Zero-Dependency Dev Mode**: Includes built-in high-concurrency transactional storage and in-memory Redis TTL lock engine so you can run and test everything immediately without needing PostgreSQL or Redis pre-installed!
2. **Full Production Mode**: Connects directly to external PostgreSQL and Redis instances via Docker Compose.

### Option 1: Standalone Dev Mode

```powershell
# 1. Start the Backend API (Port 5000)
cd "seatsync/backend"
npm install
npm test          # Runs the 14-point test suite (Auth, Concurrency, Idempotency)
npm run dev       # Starts backend with live reloading

# 2. In a separate terminal, start the Frontend (Port 5173)
cd "seatsync/frontend"
npm install
npm run dev
```

Open your browser:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Interactive Concurrency Arena**: [http://localhost:5173/engineering](http://localhost:5173/engineering)
- **Interactive Swagger API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### Option 2: Docker Compose

```powershell
docker compose up --build
```
Services spun up:
- `postgres` (Port 5432)
- `redis` (Port 6379)
- `seatsync-backend` (Port 5000)
- `seatsync-frontend` (Port 5173)

---

## 🧪 Automated Test Suite & Benchmark Results

The SeatSync integration suite runs 14 automated tests verifying real-time race condition resolution:

```powershell
cd backend
npm test
```

### Verified Scenarios:
✔ `POST /api/auth/register` - registers new user and issues JWT  
✔ `POST /api/auth/register` - rejects duplicate email with 409 Conflict  
✔ `POST /api/auth/login` - authenticates user & admin correctly  
✔ `GET /api/admin/dashboard` - guards admin endpoint with 403 for regular user  
✔ `GET /api/admin/dashboard` - grants access to admin (200 OK)  
✔ `GET /api/events` - lists events with starting price & shows  
✔ `GET /api/shows/:showId/seats` - returns seat inventory with live Redis lock states  
✔ **`SIMULTANEOUS LOCK`**: 2 users request SAME seat simultaneously -> Exactly ONE wins, ONE gets 409  
✔ **`PREVENT DOUBLE-BOOKING`**: rejects checkout booking request for seat held by another user  
✔ **`RELEASE LOCK`**: winner releases lock, seat immediately available again  
✔ **`IDEMPOTENCY KEY`**: safe retries prevent duplicate booking creation  
✔ **`PAYMENT FAILURE`**: marks booking FAILED & frees seat back to AVAILABLE  
✔ **`PAYMENT SUCCESS`**: confirms booking, marks seats BOOKED, and enqueues notification  
✔ **`3-WAY REAL-TIME CONCURRENCY BENCHMARK`**: 3 virtual users compete for Seat A10 in parallel -> 1 Winner, 2 Collisions  

---

## 🔑 Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@seatsync.com` | `Admin@123` | Full dashboard metrics, create events, view all bookings |
| **User** | `user@seatsync.com` | `Password@123` | Browse shows, lock seats, book tickets, cancel reservations |
| **User 2** | `alex@seatsync.com` | `Password@123` | Used for concurrent multi-user testing |

*(One-click demo login buttons are integrated directly into the login page UI)*

---

## 🌐 API Reference Overview

Detailed documentation is available at `/api/docs`.

### Authentication
- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/login` - Login and receive JWT Bearer token
- `GET /api/auth/me` - Get authenticated profile

### Events & Shows
- `GET /api/events` - List events with search, categories, and sorting
- `GET /api/events/:id` - Get event metadata and scheduled shows
- `POST /api/events` - Create new event *(Admin only)*
- `GET /api/shows/event/:eventId` - Get showtimes for an event
- `POST /api/shows` - Schedule a new show *(Admin only)*

### Seating & Distributed Locks
- `GET /api/shows/:showId/seats` - Retrieve full seating layout merged with Redis lock countdowns
- `POST /api/shows/:showId/seats/lock` - Acquire 10-minute temporary seat lock
- `DELETE /api/shows/:showId/seats/lock` - Release temporary seat lock

### Bookings & Payments
- `POST /api/bookings` - Atomically create booking with `Idempotency-Key` and row lock
- `GET /api/bookings` - List current user's booking history
- `GET /api/bookings/:id` - Retrieve ticket pass and QR payload
- `POST /api/bookings/:id/cancel` - Cancel booking and return seats to inventory
- `POST /api/payments` - Process payment simulation (`SUCCESS`, `FAILED`, `TIMEOUT`)

### Concurrency Lab
- `POST /api/concurrency/simulate-race` - Triggers a 3-way millisecond race condition benchmark against Seat A10 and returns transaction telemetry

---

## 💼 Portfolio & Interview Highlights

When presenting SeatSync in a systems design or backend interview, highlight:
1. **The Race Condition Bottleneck**: Why read-then-write patterns in web frameworks fail under concurrent load.
2. **Two-Phase Locking vs Optimistic Locking**: Why `SELECT ... FOR UPDATE` was chosen over version column optimistic retries.
3. **Cache Coherency**: How Redis handles ephemeral fast-expiring seat holds without polluting the persistent PostgreSQL database.
4. **Idempotency Architecture**: How distributed key caching prevents duplicate billing when clients retry dropped TCP connections.
5. **Interactive Verification**: Direct reviewers to the **SeatSync Concurrency Lab** (`/engineering`) for live proof-of-work.
