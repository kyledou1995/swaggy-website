'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldOff, Search, Users, Building2, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { User } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteOrderCount, setDeleteOrderCount] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Fetch current user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!profileData || profileData.role !== 'admin') {
          router.push('/portal/dashboard');
          return;
        }

        setCurrentUser(profileData as User);

        // Fetch all users
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        setUsers((allUsers as User[]) || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const toggleAdminRole = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      setFeedback({ type: 'error', message: 'You cannot change your own admin role.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setUpdatingId(targetUser.id);
    setFeedback(null);

    try {
      const supabase = createClient();
      const newRole = targetUser.role === 'admin' ? 'client' : 'admin';

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u)
      );

      setFeedback({
        type: 'success',
        message: `${targetUser.full_name} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Failed to update role.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteDialog = async (targetUser: User) => {
    setDeleteTarget(targetUser);
    setDeleteConfirmText('');
    setDeleteError('');
    setDeleteOrderCount(null);
    const supabase = createClient();
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', targetUser.id);
    setDeleteOrderCount(count ?? 0);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete user.');

      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setFeedback({
        type: 'success',
        message: `${deleteTarget.full_name} was deleted${result.ordersDeleted ? ` along with ${result.ordersDeleted} order${result.ordersDeleted === 1 ? '' : 's'}` : ''}. ${
          result.emailSent ? 'A confirmation email was sent to them.' : 'Note: the confirmation email could not be sent.'
        }`,
      });
      setTimeout(() => setFeedback(null), 6000);
      setDeleteTarget(null);
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.company_name?.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const clientCount = users.filter(u => u.role === 'client').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage users and admin permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex items-center gap-3 py-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-3 py-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
                <p className="text-xs text-gray-500">Admins</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-3 py-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clientCount}</p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* User List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No users found.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600 text-sm flex-shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{u.company_name || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.role === 'admin' ? 'success' : 'info'}>
                          {u.role === 'admin' ? 'Admin' : 'Client'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">{u.client_role || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.invite_status === 'active' ? 'success' : u.invite_status === 'pending' ? 'warning' : 'neutral'}>
                          {u.invite_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id === currentUser?.id ? (
                          <span className="text-xs text-gray-400 italic">You</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={u.role === 'admin' ? 'ghost' : 'primary'}
                            size="sm"
                            onClick={() => toggleAdminRole(u)}
                            disabled={updatingId === u.id}
                            isLoading={updatingId === u.id}
                          >
                            {u.role === 'admin' ? (
                              <>
                                <ShieldOff className="w-3.5 h-3.5 mr-1" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5 mr-1" />
                                Make Admin
                              </>
                            )}
                          </Button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(u)}
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? 'Remove admin access before deleting' : 'Delete user'}
                            aria-label={`Delete ${u.full_name}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeDeleteDialog}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete {deleteTarget.full_name}?</h3>
                  <p className="text-sm text-gray-500 mt-1">{deleteTarget.email}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 space-y-1.5">
                <p className="font-medium">This permanently deletes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Their account and login</li>
                  <li>
                    {deleteOrderCount === null
                      ? 'Counting orders…'
                      : `${deleteOrderCount} order${deleteOrderCount === 1 ? '' : 's'}`}{' '}
                    with all messages, updates, and uploaded files
                  </li>
                </ul>
                <p className="pt-1">This cannot be undone. They will be emailed a confirmation.</p>
              </div>

              <label className="block mt-5">
                <span className="block text-sm text-gray-700 mb-1.5">
                  Type <span className="font-mono font-semibold">DELETE</span> to confirm
                </span>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </label>

              {deleteError && (
                <p className="mt-3 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <Button variant="ghost" size="sm" onClick={closeDeleteDialog} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                isLoading={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
