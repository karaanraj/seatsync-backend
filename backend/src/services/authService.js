const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const env = require('../config/env');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

const register = async ({ name, email, password, role = 'user' }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new ConflictError('An account with this email address already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await userRepo.createUser({
    name,
    email,
    password_hash: passwordHash,
    role,
  });

  logger.info(`[Auth] New user registered: ${email} (Role: ${newUser.role})`);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.created_at,
    },
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  logger.info(`[Auth] User logged in: ${email} (${user.id})`);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
