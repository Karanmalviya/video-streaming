import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function DashboardPage() {
    const { user } = useAuth();
    const { on, off } = useSocket();
    const [stats, setStats] = useState({ total: 0, processing: 0, safe: 0, flagged: 0, failed: 0 });
    const [recentVideos, setRecentVideos] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, videosRes] = await Promise.all([
                    api.get('/videos/stats'),
                    api.get('/videos?limit=5'),
                ]);
                setStats(statsRes.data.stats);
                setRecentVideos(videosRes.data.videos);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    useEffect(() => {
        const handleCompleted = (data) => {
            setRecentVideos((prev) =>
                prev.map((v) =>
                    v._id === data.videoId
                        ? { ...v, status: data.status, classification: data.classification, progress: 100 }
                        : v
                )
            );
        };
        const handleProgress = (data) => {
            setRecentVideos((prev) =>
                prev.map((v) => (v._id === data.videoId ? { ...v, progress: data.progress } : v))
            );
        };

        on('video:completed', handleCompleted);
        on('video:progress', handleProgress);
        return () => {
            off('video:completed', handleCompleted);
            off('video:progress', handleProgress);
        };
    }, [on, off]);

    const statCards = [
        { label: 'Total Videos', value: stats.total, icon: '🎬', color: 'from-primary-500 to-indigo-500' },
        { label: 'Processing', value: stats.processing, icon: '⚙️', color: 'from-amber-500 to-orange-500' },
        { label: 'Safe', value: stats.safe, icon: '✅', color: 'from-emerald-500 to-green-500' },
        { label: 'Flagged', value: stats.flagged, icon: '🚩', color: 'from-red-500 to-rose-500' },
    ];

    const getStatusBadge = (status, classification) => {
        const styles = {
            processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            completed: classification === 'safe'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20',
            failed: 'bg-red-500/10 text-red-400 border-red-500/20',
            uploading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
        const labels = {
            processing: 'Processing',
            completed: classification === 'safe' ? 'Safe' : 'Flagged',
            failed: 'Failed',
            uploading: 'Uploading',
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || ''}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            { }
            <div>
                <h1 className="text-3xl font-bold text-dark-100">
                    Welcome back, <span className="text-gradient">{user?.name}</span>
                </h1>
                <p className="text-dark-400 mt-1">
                    Organization: <span className="text-dark-300 font-medium">{user?.organizationId}</span>
                    {' · '}
                    Role: <span className="text-primary-400 capitalize font-medium">{user?.role}</span>
                </p>
            </div>

            { }
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="glass-card rounded-xl p-5 hover:border-primary-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{stat.icon}</span>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`} />
                        </div>
                        <p className="text-2xl font-bold text-dark-100">{stat.value}</p>
                        <p className="text-sm text-dark-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            { }
            {(user?.role === 'editor' || user?.role === 'admin') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        to="/upload"
                        className="glass-card rounded-xl p-6 flex items-center space-x-4 hover:border-primary-500/30 transition-all duration-300 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            📤
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-200 group-hover:text-primary-300 transition-colors">Upload Video</h3>
                            <p className="text-sm text-dark-500">Upload and process a new video</p>
                        </div>
                    </Link>
                    <Link
                        to="/videos"
                        className="glass-card rounded-xl p-6 flex items-center space-x-4 hover:border-primary-500/30 transition-all duration-300 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🎬
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-200 group-hover:text-emerald-300 transition-colors">Video Library</h3>
                            <p className="text-sm text-dark-500">Browse and manage your videos</p>
                        </div>
                    </Link>
                </div>
            )}

            { }
            <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-dark-200">Recent Videos</h2>
                    <Link to="/videos" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                        View all →
                    </Link>
                </div>
                {recentVideos.length === 0 ? (
                    <p className="text-dark-500 text-sm text-center py-8">No videos uploaded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {recentVideos.map((video) => (
                            <Link
                                key={video._id}
                                to={`/videos/${video._id}`}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/50 transition-all duration-200 group"
                            >
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-lg flex-shrink-0">
                                        🎞️
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-dark-200 truncate group-hover:text-primary-300 transition-colors">
                                            {video.title}
                                        </p>
                                        <p className="text-xs text-dark-500">
                                            {(video.size / (1024 * 1024)).toFixed(1)} MB · {new Date(video.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    {video.status === 'processing' && (
                                        <div className="w-20 bg-dark-800 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-primary-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${video.progress}%` }}
                                            />
                                        </div>
                                    )}
                                    {getStatusBadge(video.status, video.classification)}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
