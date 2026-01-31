import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Shield,
  LogOut,
  Settings,
  ScanFace,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Home,
} from 'lucide-react';
import { getCurrentUser, clearSession as logout, getUserRole } from '../services/auth';
import { getProfile } from '../services/api';
import MobileMenuDrawer from './MobileMenuDrawer';
import ProfileAvatar from './ProfileAvatar';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());
  const [userRole, setUserRole] = useState(() => getUserRole());
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check user status
    if (user) {
      getProfile(user.id).then((result) => {
        if (result.success) {
          setUserProfile(result.data);
        }
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setUserRole(null);
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = (userRole || '').toLowerCase() === 'admin';

  const navigationItems = [
    // Main Nav
    {
      path: '/',
      label: 'Home',
      icon: Home,
      show: true,
      position: 'main',
    },
    {
      path: '/recognize',
      label: 'Recognize',
      icon: ScanFace,
      show: !!user,
      position: 'main',
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: !!user,
      position: 'main',
    },
    // User Actions
    {
      path: '/admin',
      label: 'Admin',
      icon: Shield,
      show: !!user && isAdmin,
      position: 'user',
      desktopIcon: true, // icon only on desktop
      mobileStyle:
        'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 hover:border-red-200',
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      show: !!user,
      position: 'user',
      mobileOnly: true, // Only show in mobile menu
    },
    // Auth Actions
    {
      path: '/login',
      label: 'Login',
      icon: LogIn,
      show: !user,
      position: 'auth',
    },
    {
      path: '/register',
      label: 'Register',
      icon: UserPlus,
      show: !user,
      position: 'auth',
    },
  ];

  const mainNavItems = navigationItems.filter((item) => item.position === 'main' && item.show);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center text-white shadow-lg shadow-medical-primary/20 group-hover:scale-105 transition-transform duration-300">
                <ScanFace className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-medical-primary to-medical-secondary">
                MedGlass
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex max-sm:hidden items-center gap-8">
              <div className="flex items-center gap-6">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-medical-primary ${
                      isActive(item.path) ? 'text-medical-primary' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                {user ? (
                  <div className="flex items-center gap-3">
                    {/* Desktop */}
                    {navigationItems
                      .filter((item) => item.position === 'user' && item.show && item.desktopIcon)
                      .map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                          title={item.label}
                        >
                          <item.icon className="w-5 h-5" />
                        </Link>
                      ))}

                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                      <ProfileAvatar
                        imageUrl={userProfile?.profile_picture_url}
                        userName={user.name}
                        size="sm"
                        clickable={false}
                      />
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    {navigationItems
                      .filter((item) => item.position === 'auth' && item.show)
                      .map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={
                            item.path === '/register'
                              ? 'px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-medical-primary to-medical-secondary text-white shadow-lg shadow-medical-primary/25 hover:shadow-xl hover:shadow-medical-primary/30 hover:-translate-y-0.5 transition-all'
                              : 'px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-medical-primary hover:bg-gray-50 transition-all'
                          }
                        >
                          {item.label}
                        </Link>
                      ))}
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-medical-primary hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        footer={
          user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-600 font-medium hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )
        }
      >
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-gray-50 rounded-xl border border-gray-100">
            <ProfileAvatar
              imageUrl={userProfile?.profile_picture_url}
              userName={user.name}
              size="md"
              clickable={false}
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-500 capitalize">{userRole}</span>
            </div>
          </div>
        )}

        {/* Render all navigation items for mobile */}
        {navigationItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const defaultStyle = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              isActive(item.path)
                ? 'bg-medical-primary/5 text-medical-primary'
                : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
            }`;

            const className = item.mobileStyle
              ? `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive(item.path) ? 'bg-red-100 text-red-700 border border-red-200' : item.mobileStyle}`
              : defaultStyle;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={className}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
      </MobileMenuDrawer>
    </>
  );
};

export default Navbar;
