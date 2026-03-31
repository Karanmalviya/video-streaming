import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function UploadPage() {
    const navigate = useNavigate();
    const { on, off } = useSocket();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [phase, setPhase] = useState('idle');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [currentVideoId, setCurrentVideoId] = useState(null);


    useEffect(() => {
        const handleProgress = (data) => {
            if (data.videoId === currentVideoId) {
                setProcessingProgress(data.progress);
            }
        };
        const handleCompleted = (data) => {
            if (data.videoId === currentVideoId) {
                setPhase('completed');
                setProcessingProgress(100);
                setResult(data);
            }
        };
        const handleFailed = (data) => {
            if (data.videoId === currentVideoId) {
                setPhase('failed');
                setError(data.error || 'Processing failed.');
            }
        };

        on('video:progress', handleProgress);
        on('video:completed', handleCompleted);
        on('video:failed', handleFailed);

        return () => {
            off('video:progress', handleProgress);
            off('video:completed', handleCompleted);
            off('video:failed', handleFailed);
        };
    }, [on, off, currentVideoId]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            selectFile(e.dataTransfer.files[0]);
        }
    };

    const selectFile = (f) => {
        if (!f.type.startsWith('video/')) {
            setError('Please select a valid video file.');
            return;
        }
        if (f.size > 104857600) {
            setError('File too large. Maximum 100 MB allowed.');
            return;
        }
        setError('');
        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please select a video file.');

        setError('');
        setUploading(true);
        setPhase('uploading');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title || file.name);
        formData.append('description', description);

        try {
            const res = await api.post('/videos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(pct);
                },
            });

            setCurrentVideoId(res.data.video._id);
            setPhase('processing');
            setUploadProgress(100);
        } catch (err) {
            setPhase('failed');
            setError(err.response?.data?.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setTitle('');
        setPhase('idle');
        setUploadProgress(0);
        setProcessingProgress(0);
        setResult(null);
        setError('');
        setCurrentVideoId(null);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-dark-100 mb-2">Upload Video</h1>
            <p className="text-dark-400 mb-8">Upload a video for sensitivity analysis processing</p>

            { }
            {phase === 'idle' && (
                <form onSubmit={handleSubmit} className="space-y-6" id="upload-form">
                    { }
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="video-title">Title</label>
                        <input
                            id="video-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                            placeholder="Video title (optional, defaults to filename)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1.5" htmlFor="video-description">Description <span className="text-dark-600">(optional)</span></label>
                        <textarea
                            id="video-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all resize-none"
                            placeholder="Brief description of the video content..."
                        />
                    </div>

                    { }
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300
              ${dragActive
                                ? 'border-primary-400 bg-primary-500/5'
                                : file
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/30'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
                            className="hidden"
                            id="video-file-input"
                        />

                        {file ? (
                            <div className="space-y-2">
                                <div className="text-4xl">🎬</div>
                                <p className="text-dark-200 font-medium">{file.name}</p>
                                <p className="text-dark-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-5xl opacity-50">📁</div>
                                <p className="text-dark-300 font-medium">Drag & drop your video here</p>
                                <p className="text-dark-500 text-sm">or click to browse · Max 100 MB · MP4, MOV, AVI, MKV, WebM</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-primary-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Upload & Process
                    </button>
                </form>
            )}

            { }
            {phase === 'uploading' && (
                <div className="glass-card rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4 animate-bounce">📤</div>
                        <h2 className="text-xl font-semibold text-dark-200">Uploading video...</h2>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-dark-400">Upload Progress</span>
                            <span className="text-primary-400 font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-dark-800 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            { }
            {phase === 'processing' && (
                <div className="glass-card rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">
                            <svg className="animate-spin h-12 w-12 mx-auto text-primary-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-dark-200">Analyzing video content...</h2>
                        <p className="text-dark-400 text-sm mt-1">Sensitivity analysis in progress</p>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-dark-400">Processing Progress</span>
                            <span className="text-amber-400 font-medium">{processingProgress}%</span>
                        </div>
                        <div className="w-full bg-dark-800 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${processingProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            { }
            {phase === 'completed' && result && (
                <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
                    <div className={`text-6xl ${result.classification === 'safe' ? '' : ''}`}>
                        {result.classification === 'safe' ? '✅' : '🚩'}
                    </div>
                    <h2 className="text-2xl font-bold text-dark-100">Processing Complete</h2>
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${result.classification === 'safe'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        Classification: {result.classification?.toUpperCase()}
                    </div>
                    <div className="flex gap-3 justify-center pt-4">
                        <button
                            onClick={() => navigate(`/videos/${result.videoId}`)}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all"
                        >
                            View Video
                        </button>
                        <button
                            onClick={reset}
                            className="px-6 py-2.5 rounded-xl border border-dark-600 text-dark-300 hover:bg-dark-800/50 transition-all"
                        >
                            Upload Another
                        </button>
                    </div>
                </div>
            )}

            { }
            {phase === 'failed' && (
                <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
                    <div className="text-6xl">❌</div>
                    <h2 className="text-2xl font-bold text-dark-100">Processing Failed</h2>
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={reset}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-500 hover:to-purple-500 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
