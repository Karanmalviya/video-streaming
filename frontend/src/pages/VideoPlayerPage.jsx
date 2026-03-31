import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function VideoPlayerPage() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    const [orgUsers, setOrgUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [assignSuccess, setAssignSuccess] = useState('');

    const canAssign = user?.role === 'editor' || user?.role === 'admin';
    const canReview = user?.role === 'editor' || user?.role === 'admin';
    const [reclassifying, setReclassifying] = useState(false);
    const [reclassifyMsg, setReclassifyMsg] = useState('');

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await api.get(`/videos/${id}`);
                setVideo(res.data.video);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load video.');
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);


    useEffect(() => {
        if (user?.role === 'admin') {
            api.get('/admin/users').then((res) => setOrgUsers(res.data.users)).catch(() => { });
        }
    }, [user]);


    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const streamUrl = `${API_URL}/api/videos/${id}/stream?token=${token}`;

    const handleAssign = async () => {
        if (!selectedUserId.trim()) return;
        setAssigning(true);
        setAssignError('');
        setAssignSuccess('');
        try {
            const res = await api.put(`/videos/${id}/assign`, { userIds: [selectedUserId.trim()] });
            setVideo(res.data.video);
            setSelectedUserId('');
            setAssignSuccess('Video assigned successfully!');
            setTimeout(() => setAssignSuccess(''), 3000);
        } catch (err) {
            setAssignError(err.response?.data?.message || 'Assignment failed.');
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async (userId) => {
        try {
            const res = await api.put(`/videos/${id}/unassign`, { userIds: [userId] });
            setVideo(res.data.video);
        } catch (err) {
            setAssignError(err.response?.data?.message || 'Unassign failed.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-red-400 text-lg">{error}</p>
                <button
                    onClick={() => navigate('/videos')}
                    className="mt-4 px-6 py-2 rounded-xl border border-dark-600 text-dark-300 hover:bg-dark-800/50 transition-all"
                >
                    Back to Library
                </button>
            </div>
        );
    }

    const getClassificationBadge = () => {
        if (video.classification === 'safe') {
            return (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✅ Safe
                </span>
            );
        }
        if (video.classification === 'flagged') {
            return (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    🚩 Flagged
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⏳ Pending
            </span>
        );
    };


    const assignedIds = (video.assignedTo || []).map((u) => (typeof u === 'object' ? u._id : u));
    const availableUsers = orgUsers.filter((u) => !assignedIds.includes(u._id));

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            { }
            <button
                onClick={() => navigate('/videos')}
                className="flex items-center space-x-2 text-dark-400 hover:text-dark-200 transition-colors text-sm"
            >
                <span>←</span>
                <span>Back to Library</span>
            </button>

            { }
            <div className="glass-card rounded-2xl overflow-hidden">
                {video.status === 'completed' ? (
                    <div className="relative bg-black aspect-video">
                        <video
                            controls
                            className="w-full h-full"
                            src={streamUrl}
                            id="video-player"
                        >
                            <source src={streamUrl} type={video.mimeType} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ) : (
                    <div className="aspect-video bg-dark-800 flex flex-col items-center justify-center space-y-4">
                        {video.status === 'processing' ? (
                            <>
                                <svg className="animate-spin h-16 w-16 text-primary-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <p className="text-dark-400">Processing... {video.progress}%</p>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl">❌</div>
                                <p className="text-red-400">Processing failed. Video cannot be played.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            { }
            <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">{video.title}</h1>
                        <p className="text-dark-500 text-sm mt-1">Uploaded {new Date(video.createdAt).toLocaleString()}</p>
                    </div>
                    {getClassificationBadge()}
                </div>

                <hr className="border-dark-700/50" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Filename</p>
                        <p className="text-sm text-dark-300 mt-1 truncate">{video.originalName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Size</p>
                        <p className="text-sm text-dark-300 mt-1">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Type</p>
                        <p className="text-sm text-dark-300 mt-1">{video.mimeType}</p>
                    </div>
                    <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Status</p>
                        <p className="text-sm text-dark-300 mt-1 capitalize">{video.status}</p>
                    </div>
                </div>

                {video.uploadedBy && (
                    <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Uploaded By</p>
                        <p className="text-sm text-dark-300 mt-1">{video.uploadedBy.name} ({video.uploadedBy.email})</p>
                    </div>
                )}
            </div>

            { }
            {video.description && (
                <div className="glass-card rounded-2xl px-6 py-4">
                    <p className="text-xs text-dark-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-dark-300">{video.description}</p>
                </div>
            )}

            {canReview && video.status === 'completed' && (
                <div className="glass-card rounded-2xl p-6 space-y-3">
                    <h2 className="text-lg font-semibold text-dark-200 flex items-center space-x-2">
                        <span>🔍</span>
                        <span>Content Review</span>
                    </h2>
                    <p className="text-sm text-dark-400">Override the automated sensitivity classification if incorrect.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleReclassify('safe')}
                            disabled={reclassifying || video.classification === 'safe'}
                            className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ✅ Mark as Safe
                        </button>
                        <button
                            onClick={() => handleReclassify('flagged')}
                            disabled={reclassifying || video.classification === 'flagged'}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            🚩 Mark as Flagged
                        </button>
                    </div>
                    {reclassifyMsg && (
                        <p className="text-sm text-emerald-400">{reclassifyMsg}</p>
                    )}
                </div>
            )}


            {canAssign && (
                <div className="glass-card rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-dark-200 flex items-center space-x-2">
                        <span>👥</span>
                        <span>Video Access — Assign to Viewers</span>
                    </h2>

                    { }
                    {video.assignedTo && video.assignedTo.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-dark-500 uppercase tracking-wider">Currently Assigned</p>
                            <div className="flex flex-wrap gap-2">
                                {video.assignedTo.map((assignedUser) => (
                                    <div
                                        key={typeof assignedUser === 'object' ? assignedUser._id : assignedUser}
                                        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                            {typeof assignedUser === 'object' ? assignedUser.name?.charAt(0)?.toUpperCase() : '?'}
                                        </div>
                                        <span className="text-sm text-dark-200">
                                            {typeof assignedUser === 'object'
                                                ? `${assignedUser.name} (${assignedUser.email})`
                                                : assignedUser}
                                        </span>
                                        <span className="text-xs text-dark-500 capitalize">
                                            {typeof assignedUser === 'object' ? assignedUser.role : ''}
                                        </span>
                                        <button
                                            onClick={() => handleUnassign(typeof assignedUser === 'object' ? assignedUser._id : assignedUser)}
                                            className="text-red-400 hover:text-red-300 ml-1 text-sm"
                                            title="Remove assignment"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    { }
                    <div className="space-y-2">
                        <p className="text-xs text-dark-500 uppercase tracking-wider">Assign to a User</p>
                        <div className="flex gap-3">
                            {user?.role === 'admin' && availableUsers.length > 0 ? (
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                    id="assign-user-select"
                                >
                                    <option value="">Select a user...</option>
                                    {availableUsers.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.email}) — {u.role}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    placeholder="Enter User ID to assign"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                    id="assign-user-input"
                                />
                            )}
                            <button
                                onClick={handleAssign}
                                disabled={!selectedUserId.trim() || assigning}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>

                    {assignError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{assignError}</div>
                    )}
                    {assignSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{assignSuccess}</div>
                    )}
                </div>
            )}
        </div>
    );
}
