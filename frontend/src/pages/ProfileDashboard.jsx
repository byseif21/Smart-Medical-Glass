import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
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
  const [isViewingOther, setIsViewingOther] = useState(false);
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();

  const loadProfile = async (options = {}) => {
    const silent = !!options?.silent;
    // Check if viewing another user's profile or own profile
    const currentUserId = localStorage.getItem('user_id');
    const viewingUserId = urlUserId || currentUserId;

    if (!currentUserId) {
      navigate('/login', { replace: true });
      return;
    }

    setIsViewingOther(urlUserId && urlUserId !== currentUserId);
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
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: 'main', label: 'Main Info', icon: 'user' },
    { id: 'medical', label: 'Medical Info', icon: 'heart' },
    { id: 'connections', label: 'Connections', icon: 'users' },
  ];

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
              {isViewingOther && (
                <Link to="/dashboard" className="btn-medical-secondary text-sm px-4 py-2">
                  ← My Profile
                </Link>
              )}
              <Link to="/recognize" className="btn-medical-primary text-sm px-4 py-2">
                Recognize Face
              </Link>
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
          {activeTab === 'main' && (
            <MainInfo profile={profile} onUpdate={loadProfile} readOnly={isViewingOther} />
          )}
          {activeTab === 'medical' && (
            <MedicalInfo profile={profile} onUpdate={loadProfile} readOnly={isViewingOther} />
          )}
          {activeTab === 'connections' && <Connections />}
        </div>
      </main>
    </div>
  );
};

export default ProfileDashboard;
