require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Video = require('../models/Video');

const connectTestDB = async () => {
    const testUri = process.env.MONGODB_URI + '-test';
    await mongoose.connect(testUri);
};

const cleanDB = async () => {
    await User.deleteMany({});
    await Video.deleteMany({});
};

const disconnectDB = async () => {
    await cleanDB();
    await mongoose.connection.close();
};

const createTestUser = async (overrides = {}) => {
    const userData = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        role: 'editor',
        organizationId: 'test-org',
        ...overrides,
    };

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    return { user, token };
};

module.exports = {
    connectTestDB,
    cleanDB,
    disconnectDB,
    createTestUser,
};
