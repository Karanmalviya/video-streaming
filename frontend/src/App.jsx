import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import VideoListPage from './pages/VideoListPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import AdminUsersPage from './pages/AdminUsersPage';

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <Routes>
                {}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
                />
                <Route
                    path="/register"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
                />

                {}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/upload"
                    element={
                        <ProtectedRoute roles={['editor', 'admin']}>
                            <UploadPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/videos"
                    element={
                        <ProtectedRoute>
                            <VideoListPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/videos/:id"
                    element={
                        <ProtectedRoute>
                            <VideoPlayerPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminUsersPage />
                        </ProtectedRoute>
                    }
                />

                {}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <AppRoutes />
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}
