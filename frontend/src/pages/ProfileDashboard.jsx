import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  User,
  Heart,
  Users,
  Copy,
  Check,
  ArrowLeft,
  ScanFace,
  Settings,
  LogOut,
  Shield,
  Menu,
} from 'lucide-react';
import { getCurrentUser, getUserRole, clearSession } from '../services/auth';
import MainInfo from '../components/MainInfo';
import MedicalInfo from '../components/MedicalInfo';
import Connections from '../components/Connections';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileAvatar from '../components/ProfileAvatar';
import MobileMenuDrawer from '../components/MobileMenuDrawer';
import { getProfile } from '../services/api';

const ProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idCopied, setIdCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    { id: 'main', label: 'Main Info', icon: User },
    ...(canViewMedical ? [{ id: 'medical', label: 'Medical Info', icon: Heart }] : []),
    {
      id: 'connections',
      label: isViewingOther ? 'Emergency Contacts' : 'Connections',
      icon: Users,
    },
  ];

  const desktopBtnBase =
    'flex flex-col sm:flex-row items-center justify-center p-1 sm:px-2 sm:py-1.5 md:px-4 md:py-2 gap-0.5 sm:gap-1 md:gap-2 min-w-[50px] sm:min-w-0';
  const mobileBtnBase = 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium';

  const navigationItems = [
    {
      key: 'admin',
      label: 'Admin',
      icon: Shield,
      to: '/admin',
      condition: isAdmin,
      desktopClass: `btn-medical-secondary bg-red-50 text-red-600 border-red-200 hover:bg-red-100 ${desktopBtnBase}`,
      mobileClass: `${mobileBtnBase} text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700`,
      separateDesktop: true,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: ArrowLeft,
      href: '/dashboard',
      condition: isViewingOther,
      desktopClass: `btn-medical-secondary ${desktopBtnBase}`,
      mobileClass: `${mobileBtnBase} text-medical-gray-600 hover:bg-medical-gray-50 hover:text-medical-primary`,
    },
    {
      key: 'recognize',
      label: 'Recognize',
      icon: ScanFace,
      to: '/recognize',
      condition: true,
      desktopClass: `btn-medical-primary ${desktopBtnBase}`,
      mobileClass: `${mobileBtnBase} text-medical-gray-600 hover:bg-medical-gray-50 hover:text-medical-primary`,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      to: '/settings',
      condition: !isViewingOther,
      desktopClass: `btn-medical-secondary ${desktopBtnBase}`,
      mobileClass: `${mobileBtnBase} text-medical-gray-600 hover:bg-medical-gray-50 hover:text-medical-primary`,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      condition: !isViewingOther,
      desktopClass: `btn-medical-secondary ${desktopBtnBase}`,
      mobileClass: `w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-medical-gray-200 text-medical-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all`,
      isFooter: true,
    },
  ];

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const className = isMobile ? item.mobileClass : item.desktopClass;
    const onClick = isMobile
      ? () => {
          if (item.onClick) item.onClick();
          setIsMenuOpen(false);
        }
      : item.onClick;

    const content = (
      <>
        <Icon className={isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-4 sm:h-4'} />
        <span className={isMobile ? '' : 'text-sm md:text-base leading-none sm:leading-normal'}>
          {item.label}
        </span>
      </>
    );

    if (item.href) {
      return (
        <a key={item.key} href={item.href} className={className} onClick={onClick}>
          {content}
        </a>
      );
    }

    if (item.to) {
      return (
        <Link key={item.key} to={item.to} className={className} onClick={onClick}>
          {content}
        </Link>
      );
    }

    return (
      <button key={item.key} onClick={onClick} className={className}>
        {content}
      </button>
    );
  };
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
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex flex-row items-center gap-3">
              <ProfileAvatar
                imageUrl={profile?.profile_picture_url}
                userName={profile?.name}
                size="md"
                className="sm:hidden"
              />
              <ProfileAvatar
                imageUrl={profile?.profile_picture_url}
                userName={profile?.name}
                size="lg"
                className="max-sm:hidden"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-medical-dark">
                  {profile?.name || 'User Profile'}
                </h1>
                <p className="text-sm text-medical-gray-600">
                  {isViewingOther ? 'Recognized Person Profile' : 'Medical Profile Dashboard'}
                </p>
                {profile?.id && (
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.id);
                      setIdCopied(true);
                      setTimeout(() => setIdCopied(false), 2000);
                    }}
                    title="Click to copy full ID"
                  >
                    <p className="text-xs text-medical-gray-500 font-mono group-hover:text-medical-primary transition-colors">
                      ID: {profile.id.substring(0, 8).toUpperCase()}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-16">
                      {idCopied ? (
                        <div className="flex items-center gap-1 text-green-600 animate-fade-in">
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Copied!</span>
                        </div>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-medical-gray-400 group-hover:text-medical-primary block" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="max-sm:hidden flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-2 md:gap-3">
              {navigationItems
                .filter((item) => item.condition && item.separateDesktop)
                .map((item) => renderNavItem(item))}
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3">
                {navigationItems
                  .filter((item) => item.condition && !item.separateDesktop)
                  .map((item) => renderNavItem(item))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg text-medical-gray-600 hover:text-medical-primary hover:bg-medical-gray-50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        footer={navigationItems
          .filter((item) => item.condition && item.isFooter)
          .map((item) => renderNavItem(item, true))}
      >
        {navigationItems
          .filter((item) => item.condition && !item.isFooter)
          .map((item) => renderNavItem(item, true))}
      </MobileMenuDrawer>

      {/* Tabs (Desktop) */}
      <div className="max-sm:hidden bg-white border-b border-medical-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-start gap-4 md:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 sm:py-4 px-2 border-b-2 font-medium text-sm md:text-base transition-colors flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${
                  activeTab === tab.id
                    ? 'border-medical-primary text-medical-primary'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
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

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-medical-gray-200 z-50 pb-safe-area-bottom">
        <nav className="flex justify-around items-center px-2 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-medical-primary'
                  : 'text-medical-gray-500 hover:text-medical-gray-700'
              }`}
            >
              <tab.icon
                className={`w-6 h-6 ${activeTab === tab.id ? 'fill-current' : ''}`}
                strokeWidth={activeTab === tab.id ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium ${activeTab === tab.id ? 'font-bold' : ''}`}
              >
                {tab.label === 'Emergency Contacts' ? 'Contacts' : tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ProfileDashboard;
