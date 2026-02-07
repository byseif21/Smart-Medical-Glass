import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, Shield, LogOut, Settings, ScanFace, LayoutDashboard, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MobileMenuDrawer from './MobileMenuDrawer';
import ProfileAvatar from './ProfileAvatar';

// --- Configuration ---

const getNavigationItems = (user) => {
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  return [
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
      desktopIcon: true,
      mobileStyle:
        'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 hover:border-red-200',
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      show: !!user,
      position: 'user',
      mobileOnly: true,
    },
  ];
};

// --- Sub-components ---

const NavLogo = () => (
  <Link to="/" className="flex items-center gap-2 group -mt-20 -mb-20">
    <img
      src="/MedLens.png"
      alt="MedLens"
      className="h-40 md:h-48 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
    />
  </Link>
);

const DesktopNavLinks = ({ items, currentPath }) => (
  <div className="flex items-center gap-6">
    {items.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={`text-sm font-medium transition-colors hover:text-medical-primary ${
          currentPath === item.path ? 'text-medical-primary' : 'text-gray-600'
        }`}
      >
        {item.label}
      </Link>
    ))}
  </div>
);

DesktopNavLinks.propTypes = {
  items: PropTypes.array.isRequired,
  currentPath: PropTypes.string.isRequired,
};

const UserMenu = ({ user, items, onLogout }) => (
  <div className="flex items-center gap-3">
    {items
      .filter((item) => item.desktopIcon)
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
        imageUrl={user?.profile_picture_url}
        userName={user.name}
        size="sm"
        clickable={false}
      />
      <span className="text-sm font-medium text-gray-700">{user.name}</span>
    </div>
    <button
      onClick={onLogout}
      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
      title="Logout"
    >
      <LogOut className="w-5 h-5" />
    </button>
  </div>
);

UserMenu.propTypes = {
  user: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  onLogout: PropTypes.func.isRequired,
};

const MobileNavButton = ({ onClick }) => (
  <div className="sm:hidden">
    <button
      onClick={onClick}
      className="p-2 rounded-lg text-gray-600 hover:text-medical-primary hover:bg-gray-50 transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  </div>
);

MobileNavButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

const MobileMenu = ({ isOpen, onClose, user, items, currentPath, onLogout }) => (
  <MobileMenuDrawer
    isOpen={isOpen}
    onClose={onClose}
    footer={
      user && (
        <button
          onClick={onLogout}
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
          imageUrl={user?.profile_picture_url}
          userName={user.name}
          size="md"
          clickable={false}
        />
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user.name}</span>
          <span className="text-xs text-gray-500 capitalize">{user.role}</span>
        </div>
      </div>
    )}

    {items.map((item) => {
      const Icon = item.icon;
      const defaultStyle = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        currentPath === item.path
          ? 'bg-medical-primary/5 text-medical-primary'
          : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
      }`;

      const className = item.mobileStyle
        ? `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            currentPath === item.path
              ? 'bg-red-100 text-red-700 border border-red-200'
              : item.mobileStyle
          }`
        : defaultStyle;

      return (
        <Link key={item.path} to={item.path} onClick={onClose} className={className}>
          <Icon className="w-5 h-5" />
          {item.label}
        </Link>
      );
    })}
  </MobileMenuDrawer>
);

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  items: PropTypes.array.isRequired,
  currentPath: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
};

// --- Main Component ---

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const navigationItems = getNavigationItems(user);
  const mainNavItems = navigationItems.filter((item) => item.position === 'main' && item.show);
  const userNavItems = navigationItems.filter((item) => item.position === 'user' && item.show);
  const mobileNavItems = navigationItems.filter((item) => item.show);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <NavLogo />

            {/* Desktop Navigation */}
            <div className="flex max-sm:hidden items-center gap-8">
              <DesktopNavLinks items={mainNavItems} currentPath={location.pathname} />

              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                {user && <UserMenu user={user} items={userNavItems} onLogout={handleLogout} />}
              </div>
            </div>

            <MobileNavButton onClick={() => setIsMenuOpen(true)} />
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        items={mobileNavItems}
        currentPath={location.pathname}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Navbar;
