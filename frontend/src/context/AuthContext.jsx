import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    const isAuthenticated = !!token && !!user;


    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [user]);

    const register = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/register', data);
            setToken(res.data.token);
            setUser(res.data.user);
            return res.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', data);
            setToken(res.data.token);
            setUser(res.data.user);
            return res.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const fetchMe = useCallback(async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch {
            logout();
        }
    }, [logout]);

    return (
        <AuthContext.Provider
            value={{ user, token, isAuthenticated, loading, register, login, logout, fetchMe }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
