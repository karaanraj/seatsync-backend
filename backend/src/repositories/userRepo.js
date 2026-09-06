const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const findByEmail = async (email) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.users.find((u) => u.id === id) || null;
  }
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createUser = async ({ name, email, password_hash, role = 'user' }) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const newUser = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password_hash,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.users.push(newUser);
    return newUser;
  }
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email.toLowerCase(), password_hash, role]
  );
  return result.rows[0];
};

const getAllUsers = async () => {
  if (isUsingMemoryStore()) {
    return getMemoryDb().users.map(({ password_hash, ...u }) => u);
  }
  const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  getAllUsers,
};
