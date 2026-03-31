import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        organizationId: '',
        role: 'editor',
    });
    const [error, setError] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors([]);
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || 'Registration failed.');
            if (data?.errors) setErrors(data.errors);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-4 shadow-lg shadow-primary-500/25">
                        <span className="text-3xl">🎥</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">VideoStream</h1>
                    <p className="text-dark-400 mt-2">Create your account</p>
                </div>

                {}
                <div className="glass-card rounded-2xl p-8 shadow-xl">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                            {errors.length > 0 && (
                                <ul className="mt-2 list-disc list-inside">
                                    {errors.map((e, i) => (
                                        <li key={i}>{e.field}: {e.message}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="reg-name">Full Name</label>
                            <input
                                id="reg-name"
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                required
                                minLength={6}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                placeholder="Min 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="reg-org">Organization ID</label>
                            <input
                                id="reg-org"
                                type="text"
                                required
                                value={form.organizationId}
                                onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                placeholder="e.g. acme-corp"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="reg-role">Role</label>
                            <select
                                id="reg-role"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                            >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>Creating account...</span>
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-dark-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
