const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('viewer', 'editor', 'admin').default('editor'),
    organizationId: Joi.string().trim().min(1).max(100).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
