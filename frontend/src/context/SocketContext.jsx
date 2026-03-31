import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const listenersRef = useRef(new Map());

    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, token]);


    const on = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }

        const existing = listenersRef.current.get(event) || [];
        existing.push(callback);
        listenersRef.current.set(event, existing);
    }, []);


    const off = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
        const existing = listenersRef.current.get(event) || [];
        listenersRef.current.set(
            event,
            existing.filter((cb) => cb !== callback)
        );
    }, []);

    return (
        <SocketContext.Provider value={{ connected, on, off, socket: socketRef }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
};
