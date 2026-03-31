import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                setUsers(res.data.users);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load users.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        setUpdatingId(userId);
        try {
            const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, role: res.data.user.role } : u))
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update role.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleBadge = (role) => {
        const config = {
            admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            editor: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
            viewer: 'bg-dark-700/50 text-dark-400 border-dark-600',
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[role]}`}>
                {role}
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
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-dark-100">User Management</h1>
                <p className="text-dark-400 mt-1">Manage user roles and permissions</p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" id="users-table">
                        <thead>
                            <tr className="border-b border-dark-700/50">
                                <th className="text-left px-6 py-4 text-xs font-medium text-dark-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Organization</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Joined</th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/30">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-dark-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                                {u.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-dark-200">{u.name}</p>
                                                <p className="text-xs text-dark-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-dark-400">{u.organizationId}</td>
                                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                                    <td className="px-6 py-4 text-sm text-dark-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            disabled={updatingId === u._id}
                                            className="px-3 py-1.5 rounded-lg bg-dark-900/50 border border-dark-700 text-dark-300 text-sm focus:outline-none focus:border-primary-500/50 disabled:opacity-50 transition-all"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && (
                    <div className="text-center py-12 text-dark-500">No users found.</div>
                )}
            </div>
        </div>
    );
}
