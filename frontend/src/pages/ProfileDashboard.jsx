import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { getCurrentUser, getUserRole, clearSession } from '../services/auth';
import MainInfo from '../components/MainInfo';
import MedicalInfo from '../components/MedicalInfo';
import Connections from '../components/Connections';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileAvatar from '../components/ProfileAvatar';
import { getProfile } from '../services/api';

const ProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const currentUserId = getCurrentUser()?.id;
  const userRole = getUserRole();

  // derived state
  const isViewingOther = urlUserId && urlUserId !== currentUserId;
  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const canViewMedical = !isViewingOther || isAdmin || userRole === 'doctor';
  const canEdit = !isViewingOther || isAdmin;

  const loadProfile = async (options = {}) => {
    const silent = !!options?.silent;
    const viewingUserId = urlUserId || currentUserId;

    if (!currentUserId) {
      navigate('/login', { replace: true });
      return;
    }

    if (!silent) setLoading(true);
    const result = await getProfile(viewingUserId);

    if (result.success) {
      setProfile(result.data);
    } else {
      console.error('Failed to load profile:', result.error);
    }
    if (!silent) setLoading(false);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setActiveTab('main');
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlUserId]);

  const tabs = [
    { id: 'main', label: 'Main Info', icon: 'user' },
    ...(canViewMedical ? [{ id: 'medical', label: 'Medical Info', icon: 'heart' }] : []),
    {
      id: 'connections',
      label: isViewingOther ? 'Emergency Contacts' : 'Connections',
      icon: 'users',
    },
  ];

  useEffect(() => {
    if (activeTab === 'medical' && !canViewMedical) {
      setActiveTab('main');
    }
  }, [activeTab, canViewMedical]);

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-gradient">
      {/* Header */}
      <header className="bg-white shadow-medical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                imageUrl={profile?.profile_picture_url}
                userName={profile?.name}
                size="md"
              />
              <div>
                <h1 className="text-xl font-bold text-medical-dark">
                  {profile?.name || 'User Profile'}
                </h1>
                <p className="text-sm text-medical-gray-600">
                  {isViewingOther ? 'Recognized Person Profile' : 'Medical Profile Dashboard'}
                </p>
                {profile?.id && (
                  <p className="text-xs text-medical-gray-500 font-mono">
                    ID: {profile.id.substring(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn-medical-secondary text-sm px-4 py-2 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                >
                  Admin Panel
                </Link>
              )}
              {isViewingOther && (
                <a href="/dashboard" className="btn-medical-secondary text-sm px-4 py-2">
                  ← My Profile
                </a>
              )}
              <Link to="/recognize" className="btn-medical-primary text-sm px-4 py-2">
                Recognize Face
              </Link>
              {!isViewingOther && (
                <Link to="/settings" className="btn-medical-secondary text-sm px-4 py-2">
                  Settings
                </Link>
              )}
              {!isViewingOther && (
                <button onClick={handleLogout} className="btn-medical-secondary text-sm px-4 py-2">
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-medical-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-medical-primary text-medical-primary'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {isViewingOther && (
            <div className="medical-card mb-6 border border-yellow-200 bg-yellow-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-yellow-900">
                    {isAdmin ? 'Admin view' : 'Read-only view'}
                  </p>
                  <p className="text-sm text-yellow-800">
                    {isAdmin
                      ? 'You are viewing another user profile. Changes apply to this user.'
                      : 'You are viewing another user profile. Editing is disabled.'}
                  </p>
                </div>
                {userRole && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-900">
                    Role: {userRole}
                  </span>
                )}
              </div>
            </div>
          )}
          <div hidden={activeTab !== 'main'}>
            <MainInfo
              profile={profile}
              onUpdate={loadProfile}
              readOnly={!canEdit}
              targetUserId={urlUserId}
            />
          </div>
          {canViewMedical && (
            <div hidden={activeTab !== 'medical'}>
              <MedicalInfo
                profile={profile}
                onUpdate={loadProfile}
                readOnly={!canEdit}
                targetUserId={urlUserId}
              />
            </div>
          )}
          <div hidden={activeTab !== 'connections'}>
            {isViewingOther ? (
              <div className="medical-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Emergency Contacts</h2>
                </div>
                {profile?.emergency_contacts?.length ? (
                  <div className="space-y-2">
                    {profile.emergency_contacts.map((relative) => (
                      <div
                        key={
                          relative.id || `${relative.name}-${relative.phone}-${relative.relation}`
                        }
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-medical-gray-200"
                      >
                        <div>
                          <p className="font-medium text-medical-dark">{relative.name}</p>
                          <p className="text-sm text-medical-gray-600">{relative.relation}</p>
                        </div>
                        <p className="text-medical-primary font-medium">{relative.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-medical-gray-600">No emergency contacts found.</p>
                )}
              </div>
            ) : (
              <Connections />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileDashboard;
