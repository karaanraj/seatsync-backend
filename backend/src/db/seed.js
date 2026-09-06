const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getMemoryDb, isUsingMemoryStore, query, initDb } = require('../config/db');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  await initDb();
  logger.info('Seeding SeatSync database with realistic events, shows, and seats...');

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const regularUserId = '22222222-2222-2222-2222-222222222222';
  const user2Id = '33333333-3333-3333-3333-333333333333';

  const users = [
    {
      id: adminUserId,
      name: 'SeatSync Admin',
      email: 'admin@seatsync.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: regularUserId,
      name: 'Karan Raj',
      email: 'user@seatsync.com',
      password_hash: passwordHash,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: user2Id,
      name: 'Alex Turner',
      email: 'alex@seatsync.com',
      password_hash: passwordHash,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const events = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      title: 'Avengers: Secret Wars',
      description: 'The multiverse collapses as the greatest assembly of heroes battle to preserve reality itself in this cinematic marvel.',
      category: 'Movies',
      location: 'New Delhi',
      venue_name: 'PVR Select Citywalk, Saket',
      duration_mins: 180,
      poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      title: 'Interstellar: 12th Anniversary IMAX',
      description: 'Christopher Nolan’s timeless sci-fi masterpiece returns to the giant IMAX 70mm screen for a limited anniversary run.',
      category: 'Movies',
      location: 'Mumbai',
      venue_name: 'PVR INOX Palladium, Lower Parel',
      duration_mins: 169,
      poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e3333333-3333-3333-3333-333333333333',
      title: 'Coldplay: Music of the Spheres 2026',
      description: 'Experience the electric, stadium-filling visual spectacle and greatest hits of Coldplay under the open sky.',
      category: 'Concerts',
      location: 'Mumbai',
      venue_name: 'DY Patil Stadium, Navi Mumbai',
      duration_mins: 150,
      poster_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e4444444-4444-4444-4444-444444444444',
      title: 'Diljit Dosanjh: Dil-Luminati Tour',
      description: 'High energy Punjabi beats, breathtaking stage design, and pure unmatched charisma live in concert.',
      category: 'Concerts',
      location: 'New Delhi',
      venue_name: 'Jawaharlal Nehru Stadium',
      duration_mins: 140,
      poster_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e5555555-5555-5555-5555-555555555555',
      title: 'Zakir Khan: Live & Raw Comedy Tour',
      description: 'The Sakht Launda brings hilarious relatable storytelling, heartfelt poetry, and side-splitting observations.',
      category: 'Stand-up',
      location: 'Bengaluru',
      venue_name: 'Good Shepherd Auditorium',
      duration_mins: 110,
      poster_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e6666666-6666-6666-6666-666666666666',
      title: 'ICC Champions Trophy: India vs Australia',
      description: 'The ultimate cricket rivalry ignites under the floodlights. Don’t miss every ball, boundary, and wicket live.',
      category: 'Sports',
      location: 'Mumbai',
      venue_name: 'Wankhede Stadium',
      duration_mins: 240,
      poster_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const shows = [];
  const seats = [];

  // Create shows for each event
  const showTimes = ['10:30 AM', '01:30 PM', '05:30 PM', '09:00 PM'];
  const formats = ['IMAX 3D', '4DX', 'IMAX 2D', '2D'];

  events.forEach((event, eventIdx) => {
    showTimes.forEach((timeStr, timeIdx) => {
      const showId = `s${eventIdx + 1}00000-0000-0000-0000-00000000000${timeIdx + 1}`;
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + 1 + (eventIdx % 3)); // scheduled for future dates
      const [hours, minsPart] = timeStr.split(':');
      const [mins, ampm] = minsPart.split(' ');
      let h = parseInt(hours, 10);
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      showDate.setHours(h, parseInt(mins, 10), 0, 0);

      const basePrice = event.category === 'Concerts' ? 1200 : event.category === 'Sports' ? 800 : 280;

      shows.push({
        id: showId,
        event_id: event.id,
        show_time: showDate.toISOString(),
        format: formats[timeIdx % formats.length],
        language: event.category === 'Stand-up' ? 'Hindi' : 'English',
        base_price: basePrice,
        total_seats: 50,
        available_seats: 46,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Generate 50 seats per show: Rows A to E, cols 1 to 10
      const rows = ['A', 'B', 'C', 'D', 'E'];
      rows.forEach((row, rIdx) => {
        for (let col = 1; col <= 10; col++) {
          const seatNum = `${row}${col}`;
          const seatId = `seat-${showId}-${seatNum}`;
          let category = 'STANDARD';
          let price = basePrice;

          if (row === 'C' || row === 'D') {
            category = 'PREMIUM';
            price = basePrice + 80;
          } else if (row === 'E') {
            category = 'VIP';
            price = basePrice + 160;
          }

          // Pre-book a few demo seats for realistic feel (e.g. A1, A2, B7, C4)
          const isPreBooked = (row === 'A' && (col === 1 || col === 2)) || (row === 'B' && col === 7) || (row === 'C' && col === 4);

          seats.push({
            id: seatId,
            show_id: showId,
            seat_number: seatNum,
            row_label: row,
            seat_col: col,
            category,
            price,
            status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
    });
  });

  // Seed demo booking
  const demoBookingId = 'SS-2026-000101';
  const bookings = [
    {
      id: demoBookingId,
      user_id: regularUserId,
      show_id: shows[0].id,
      total_amount: 560,
      status: 'CONFIRMED',
      idempotency_key: 'seed-idemp-key-101',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const booking_items = [
    {
      id: uuidv4(),
      booking_id: demoBookingId,
      seat_id: `seat-${shows[0].id}-A1`,
      price: 280,
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      booking_id: demoBookingId,
      seat_id: `seat-${shows[0].id}-A2`,
      price: 280,
      created_at: new Date().toISOString(),
    },
  ];

  const payments = [
    {
      id: uuidv4(),
      booking_id: demoBookingId,
      amount: 560,
      payment_method: 'UPI',
      status: 'SUCCESS',
      transaction_ref: 'TXN-SEATSYNC-DEMO-991',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const notifications = [
    {
      id: uuidv4(),
      user_id: regularUserId,
      booking_id: demoBookingId,
      type: 'BOOKING_CONFIRMED',
      recipient_email: 'user@seatsync.com',
      message: 'Your SeatSync booking SS-2026-000101 is confirmed! Seats: A1, A2.',
      status: 'SENT',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const memoryDb = getMemoryDb();
  memoryDb.users = users;
  memoryDb.events = events;
  memoryDb.shows = shows;
  memoryDb.seats = seats;
  memoryDb.bookings = bookings;
  memoryDb.booking_items = booking_items;
  memoryDb.payments = payments;
  memoryDb.notifications = notifications;

  logger.info(`Seeded ${users.length} users, ${events.length} events, ${shows.length} shows, ${seats.length} seats, and ${bookings.length} demo bookings.`);
  return { users, events, shows, seats, bookings };
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Database seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
