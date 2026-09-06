/**
 * SeatSync API Client
 */

const getHeaders = (options = {}) => {
  const token = localStorage.getItem('seatsync_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.errorCode = data.errorCode;
    error.details = data.details;
    throw error;
  }
  return data;
};

export const api = {
  // Auth
  register: (body) =>
    fetch('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  login: (body) =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  getMe: () =>
    fetch('/api/auth/me', {
      headers: getHeaders(),
    }).then(handleResponse),

  // Events & Shows
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.location && params.location !== 'All') query.append('location', params.location);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const queryString = query.toString();
    return fetch(`/api/events${queryString ? `?${queryString}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getEventById: (id) =>
    fetch(`/api/events/${id}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getShowsByEvent: (eventId) =>
    fetch(`/api/shows/event/${eventId}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getShowById: (id) =>
    fetch(`/api/shows/${id}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // Seats & Locks
  getShowSeats: (showId) =>
    fetch(`/api/shows/${showId}/seats`, {
      headers: getHeaders(),
    }).then(handleResponse),

  lockSeats: (showId, seatIds) =>
    fetch(`/api/shows/${showId}/seats/lock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ seatIds }),
    }).then(handleResponse),

  releaseSeats: (showId, seatIds) =>
    fetch(`/api/shows/${showId}/seats/lock`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ seatIds }),
    }).then(handleResponse),

  // Bookings
  createBooking: ({ showId, seatIds, idempotencyKey, customerDetails }) =>
    fetch('/api/bookings', {
      method: 'POST',
      headers: getHeaders({ idempotencyKey }),
      body: JSON.stringify({ showId, seatIds, customerDetails }),
    }).then(handleResponse),

  getMyBookings: () =>
    fetch('/api/bookings', {
      headers: getHeaders(),
    }).then(handleResponse),

  getBookingById: (id) =>
    fetch(`/api/bookings/${id}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  cancelBooking: (id) =>
    fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  // Payments
  processPayment: ({ bookingId, paymentMethod, simulateOutcome }) =>
    fetch('/api/payments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookingId, paymentMethod, simulateOutcome }),
    }).then(handleResponse),

  // Admin
  getAdminDashboard: () =>
    fetch('/api/admin/dashboard', {
      headers: getHeaders(),
    }).then(handleResponse),

  getAdminBookings: (page = 1, limit = 20, status = null) => {
    const query = new URLSearchParams({ page, limit });
    if (status && status !== 'ALL') query.append('status', status);
    return fetch(`/api/admin/bookings?${query.toString()}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  createEvent: (data) =>
    fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  createShow: (data) =>
    fetch('/api/shows', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Concurrency Simulation Lab
  simulateRaceCondition: (showId, seatNumber = 'A10') =>
    fetch('/api/concurrency/simulate-race', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ showId, seatNumber }),
    }).then(handleResponse),
};
