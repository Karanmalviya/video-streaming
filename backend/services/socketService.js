const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (socketIo) => {
    io = socketIo;


    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.user.email} (${socket.id})`);


        socket.join(`user:${socket.user._id}`);


        socket.join(`org:${socket.user.organizationId}`);

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.user.email}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initSocket, getIO };
