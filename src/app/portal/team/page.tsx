'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Crown,
  Trash2,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase';
import { User, ClientRole, TeamMember } from '@/types';

interface TeamMemberWithId extends TeamMember {
  id: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'manager' as ClientRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          router.push('/auth/login');
          return;
        }

        setCurrentUser(profile);

        // Fetch team members (only if user is owner)
        if (profile.client_role === 'owner') {
          const { data: members, error: membersError } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .neq('id', user.id)
            .order('created_at', { ascending: false });

          if (membersError) {
            throw membersError;
          }

          setTeamMembers(members || []);
        } else {
          // Fetch team members as read-only for non-owners
          const { data: members, error: membersError } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

          if (membersError) {
            throw membersError;
          }

          setTeamMembers(members || []);
        }
      } catch (error) {
        console.error('Error loading team data:', error);
        setErrorMessage('Failed to load team data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const validateInviteForm = () => {
    const errors: Record<string, string> = {};

    if (!inviteForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!inviteForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    // Check if email already exists in team
    if (teamMembers.some((member) => member.email === inviteForm.email)) {
      errors.email = 'This email is already part of the team';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInviteForm() || !currentUser) {
      return;
    }

    setInviteLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const supabase = createClient();

      // Insert pending profile
      const { error } = await supabase.from('profiles').insert([
        {
          email: inviteForm.email,
          full_name: inviteForm.fullName,
          client_role: inviteForm.role,
          invite_status: 'pending',
          invited_by: currentUser.id,
          organization_id: currentUser.organization_id,
          company_name: currentUser.company_name,
          role: 'client',
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccessMessage(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: '', fullName: '', role: 'manager' });
      setFormErrors({});
      setShowInviteForm(false);

      // Reload team members
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', currentUser.organization_id)
        .neq('id', currentUser.id)
        .order('created_at', { ascending: false });

      setTeamMembers(members || []);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error inviting team member:', error);
      setErrorMessage('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    setDeleteLoading(memberId);
    setErrorMessage('');

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
      setSuccessMessage(`${memberEmail} has been removed from the team`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error removing team member:', error);
      setErrorMessage('Failed to remove team member. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: ClientRole,
    memberEmail: string
  ) => {
    setRoleUpdateLoading(memberId);
    setErrorMessage('');

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ client_role: newRole })
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      setTeamMembers(
        teamMembers.map((m) =>
          m.id === memberId ? { ...m, client_role: newRole } : m
        )
      );

      setSuccessMessage(`${memberEmail} role updated to ${newRole}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error updating role:', error);
      setErrorMessage('Failed to update role. Please try again.');
    } finally {
      setRoleUpdateLoading(null);
    }
  };

  const getRoleIcon = (role: ClientRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />;
      case 'manager':
        return <Shield className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: ClientRole) => {
    switch (role) {
      case 'owner':
        return 'success';
      case 'manager':
        return 'info';
      case 'viewer':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getInviteStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getInviteStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isOwner = currentUser?.client_role === 'owner';

  return (
    <PortalLayout
      pageTitle="Team"
      userName={currentUser?.full_name || ''}
      userEmail={currentUser?.email || ''}
      companyName={currentUser?.company_name || ''}
      clientRole={currentUser?.client_role}
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
            <p className="text-gray-600">
              {isOwner
                ? 'Manage your team members and assign roles.'
                : 'View your team members.'}
            </p>
          </div>
          {isOwner && (
            <Button
              variant="primary"
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {showInviteForm ? 'Cancel' : 'Invite Team Member'}
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && isOwner && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="border-b border-green-200 bg-green-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Invite a Team Member
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="team@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  error={formErrors.email}
                  disabled={inviteLoading}
                />
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={inviteForm.fullName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, fullName: e.target.value })
                  }
                  error={formErrors.fullName}
                  disabled={inviteLoading}
                />
              </div>

              <Select
                label="Role"
                options={[
                  { value: 'manager', label: 'Manager - Can manage orders and team' },
                  {
                    value: 'viewer',
                    label: 'Viewer - Can only view orders',
                  },
                ]}
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    role: e.target.value as ClientRole,
                  })
                }
                disabled={inviteLoading}
              />

              <p className="text-sm text-gray-600">
                Note: Owner role cannot be assigned. Owners have full access to
                team and account settings.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={inviteLoading}
                  disabled={inviteLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setFormErrors({});
                  }}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Team Members List */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Loading team members...</p>
            </div>
          </CardBody>
        </Card>
      ) : teamMembers.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No team members yet
              </h3>
              <p className="text-gray-600 mb-6">
                {isOwner
                  ? 'Invite team members to collaborate on orders.'
                  : 'Your team will appear here.'}
              </p>
              {isOwner && (
                <Button
                  variant="primary"
                  onClick={() => setShowInviteForm(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Your First Team Member
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <Card key={member.id} hover className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Member Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.full_name}
                          </h3>
                          {member.client_role === 'owner' && (
                            <Badge variant="success" size="sm">
                              <Crown className="w-3 h-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Controls */}
                  <div className="flex items-center gap-4 ml-4">
                    {/* Invite Status */}
                    {member.invite_status !== 'active' && (
                      <Badge
                        variant={getInviteStatusColor(member.invite_status) as any}
                        size="sm"
                      >
                        {getInviteStatusIcon(member.invite_status)}
                        <span className="ml-1 capitalize">
                          {member.invite_status}
                        </span>
                      </Badge>
                    )}

                    {/* Role Badge/Selector - Owner Only */}
                    {isOwner && member.client_role !== 'owner' ? (
                      <Select
                        options={[
                          { value: 'manager', label: 'Manager' },
                          { value: 'viewer', label: 'Viewer' },
                        ]}
                        value={member.client_role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as ClientRole,
                            member.email
                          )
                        }
                        disabled={roleUpdateLoading === member.id}
                        className="w-32 text-sm py-1.5"
                      />
                    ) : (
                      <Badge variant={getRoleColor(member.client_role) as any} size="sm">
                        {getRoleIcon(member.client_role)}
                        <span className="ml-1 capitalize">
                          {member.client_role}
                        </span>
                      </Badge>
                    )}

                    {/* Remove Button - Owner Only */}
                    {isOwner && member.client_role !== 'owner' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleRemoveMember(member.id, member.email)
                        }
                        isLoading={deleteLoading === member.id}
                        disabled={deleteLoading === member.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Current User Info */}
      {currentUser && (
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                {currentUser.client_role === 'owner' ? (
                  <Crown className="w-5 h-5 text-green-600" />
                ) : (
                  <Users className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Role</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {currentUser.client_role}
                </p>
              </div>
              <p className="text-sm text-gray-500 ml-auto">
                {currentUser.client_role === 'owner'
                  ? 'You have full access to manage your team and orders.'
                  : currentUser.client_role === 'manager'
                    ? 'You can manage orders and view team members.'
                    : 'You can view orders and team members.'}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </PortalLayout>
  );
}
