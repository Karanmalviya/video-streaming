require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});
initSocket(io);

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests. Please try again later.' },
});
app.use('/api/auth', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: "Hello API is working"
    });
});
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
