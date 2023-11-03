// validation.js
const Joi = require('joi');

// Validation schema for creating a new user
const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Validation schema for signing in a user
const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation schema for creating a new role
const roleSchema = Joi.object({
  name:Joi.string().min(3).required(),
});

// Validation schema for creating a new community
const communitySchema = Joi.object({
  name: Joi.string().required(),
});

// Validation schema for creating a new member
const memberSchema = Joi.object({
  community: Joi.string().required(),
  user: Joi.string().required(),
  role: Joi.string().required(),
});

module.exports = {
  userSchema,
  signInSchema,
  roleSchema,
  communitySchema,
  memberSchema,
};
