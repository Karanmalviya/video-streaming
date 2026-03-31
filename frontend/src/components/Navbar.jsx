import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const { connected } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) return null;

    const navLinks = [
        { to: '/', label: 'Dashboard', icon: '📊' },
        { to: '/upload', label: 'Upload', icon: '📤', roles: ['editor', 'admin'] },
        { to: '/videos', label: 'Library', icon: '🎬' },
    ];

    if (user?.role === 'admin') {
        navLinks.push({ to: '/admin/users', label: 'Users', icon: '👥' });
    }

    return (
        <nav className="glass-card border-b border-primary-900/30 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🎥</span>
                        <span className="text-xl font-bold text-gradient hidden sm:inline">VideoStream</span>
                    </Link>

                    {}
                    <div className="flex items-center space-x-1">
                        {navLinks.map((link) => {
                            if (link.roles && !link.roles.includes(user?.role)) return null;
                            const isActive = location.pathname === link.to;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5
                    ${isActive
                                            ? 'bg-primary-600/20 text-primary-300'
                                            : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                        }`}
                                >
                                    <span>{link.icon}</span>
                                    <span className="hidden md:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {}
                    <div className="flex items-center space-x-3">
                        {}
                        <div className="flex items-center space-x-1.5" title={connected ? 'Connected' : 'Disconnected'}>
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                            <span className="text-xs text-dark-500 hidden lg:inline">
                                {connected ? 'Live' : 'Offline'}
                            </span>
                        </div>

                        {}
                        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800/50">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="text-xs">
                                <p className="font-medium text-dark-200">{user?.name}</p>
                                <p className="text-dark-500 capitalize">{user?.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
