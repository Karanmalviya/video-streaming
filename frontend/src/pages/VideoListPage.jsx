import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function VideoListPage() {
    const { user } = useAuth();
    const { on, off } = useSocket();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [statusFilter, setStatusFilter] = useState('');
    const [classificationFilter, setClassificationFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');


    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(search), 400);
        return () => clearTimeout(timer);
    }, [search]);


    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                const params = { page: pagination.page, limit: 12, sortBy, sortOrder };
                if (statusFilter) params.status = statusFilter;
                if (classificationFilter) params.classification = classificationFilter;
                if (searchDebounce) params.search = searchDebounce;

                const res = await api.get('/videos', { params });
                setVideos(res.data.videos);
                setPagination(res.data.pagination);
            } catch (err) {
                console.error('Failed to fetch videos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [pagination.page, statusFilter, classificationFilter, searchDebounce, sortBy, sortOrder]);


    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, [statusFilter, classificationFilter, searchDebounce, sortBy, sortOrder]);


    useEffect(() => {
        const handleProgress = (data) => {
            setVideos((prev) =>
                prev.map((v) => (v._id === data.videoId ? { ...v, progress: data.progress } : v))
            );
        };
        const handleCompleted = (data) => {
            setVideos((prev) =>
                prev.map((v) =>
                    v._id === data.videoId
                        ? { ...v, status: 'completed', classification: data.classification, progress: 100 }
                        : v
                )
            );
        };
        const handleFailed = (data) => {
            setVideos((prev) =>
                prev.map((v) => (v._id === data.videoId ? { ...v, status: 'failed', progress: 0 } : v))
            );
        };

        on('video:progress', handleProgress);
        on('video:completed', handleCompleted);
        on('video:failed', handleFailed);
        return () => {
            off('video:progress', handleProgress);
            off('video:completed', handleCompleted);
            off('video:failed', handleFailed);
        };
    }, [on, off]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this video?')) return;
        try {
            await api.delete(`/videos/${id}`);
            setVideos((prev) => prev.filter((v) => v._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        }
    };

    const getStatusBadge = (status, classification) => {
        const config = {
            processing: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Processing' },
            uploading: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Uploading' },
            failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Failed' },
            completed: classification === 'safe'
                ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Safe' }
                : { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Flagged' },
        };
        const c = config[status] || config.processing;
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>
        );
    };

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
    ];

    const classificationOptions = [
        { value: '', label: 'All Content' },
        { value: 'safe', label: '✅ Safe' },
        { value: 'flagged', label: '🚩 Flagged' },
        { value: 'pending', label: '⏳ Pending' },
    ];

    const canDelete = user?.role === 'editor' || user?.role === 'admin';
    const canUpload = user?.role === 'editor' || user?.role === 'admin';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-dark-100">Video Library</h1>
                {canUpload && (
                    <Link
                        to="/upload"
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all text-sm shadow-lg shadow-primary-500/25"
                    >
                        <span>📤</span>
                        <span>Upload</span>
                    </Link>
                )}
            </div>

            {}
            <div className="space-y-3">
                {}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by filename or title..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                        id="search-videos"
                    />
                </div>

                {}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    {}
                    <div className="flex gap-2 flex-wrap">
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === opt.value
                                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                                    : 'bg-dark-800/50 text-dark-400 border border-dark-700 hover:bg-dark-700/50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {}
                    <div className="flex gap-2 flex-wrap">
                        {classificationOptions.map((opt) => (
                            <button
                                key={`cls-${opt.value}`}
                                onClick={() => setClassificationFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${classificationFilter === opt.value
                                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-dark-800/50 text-dark-400 border border-dark-700 hover:bg-dark-700/50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {}
                    <div className="flex items-center gap-2 ml-auto">
                        <label className="text-xs text-dark-500">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-dark-900/50 border border-dark-700 text-dark-300 text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                            id="sort-by"
                        >
                            <option value="createdAt">Upload Date</option>
                            <option value="size">File Size</option>
                            <option value="title">Title</option>
                        </select>
                        <button
                            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                            className="px-2.5 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700 text-dark-400 hover:bg-dark-700/50 transition-all text-xs"
                            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                        >
                            {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
                        </button>
                    </div>
                </div>
            </div>

            {}
            {!loading && (
                <p className="text-xs text-dark-500">{pagination.total} video{pagination.total !== 1 ? 's' : ''} found</p>
            )}

            {}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4 opacity-40">🎬</div>
                    <p className="text-dark-400 text-lg">No videos found</p>
                    <p className="text-dark-500 text-sm mt-1">Try adjusting your filters or upload a new video</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <div
                            key={video._id}
                            className="glass-card rounded-xl overflow-hidden hover:border-primary-500/20 transition-all duration-300 group"
                        >
                            {}
                            <Link to={`/videos/${video._id}`} className="block relative h-40 bg-dark-800 flex items-center justify-center">
                                <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">🎬</span>
                                {video.status === 'processing' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1">
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
                                            style={{ width: `${video.progress}%` }}
                                        />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(video.status, video.classification)}
                                </div>
                            </Link>

                            {}
                            <div className="p-4">
                                <Link to={`/videos/${video._id}`}>
                                    <h3 className="font-medium text-dark-200 truncate group-hover:text-primary-300 transition-colors">
                                        {video.title}
                                    </h3>
                                </Link>
                                <div className="flex items-center justify-between mt-2 text-xs text-dark-500">
                                    <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>
                                {canDelete && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleDelete(video._id)}
                                            className="text-xs text-dark-500 hover:text-red-400 transition-colors"
                                            title="Delete video"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page <= 1}
                        className="px-4 py-2 rounded-lg border border-dark-700 text-dark-400 hover:bg-dark-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-dark-400">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page >= pagination.pages}
                        className="px-4 py-2 rounded-lg border border-dark-700 text-dark-400 hover:bg-dark-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
