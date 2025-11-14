import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import '../styles/glassmorphism.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSignIn = async () => {
    // Simple email/password sign in - you can customize this
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');

    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Sign in failed: ' + error.message);
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-card sticky top-0 z-50 mx-4 mt-4 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold neon-gradient-text">Smart Glass AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive('/')
                    ? 'glow-border-pink text-white'
                    : 'text-gray-300 hover:text-white hover:glow-border-blue'
                }`}
              >
                Home
              </Link>
              <Link
                to="/register"
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive('/register')
                    ? 'glow-border-pink text-white'
                    : 'text-gray-300 hover:text-white hover:glow-border-blue'
                }`}
              >
                Register
              </Link>
              <Link
                to="/recognize"
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive('/recognize')
                    ? 'glow-border-pink text-white'
                    : 'text-gray-300 hover:text-white hover:glow-border-blue'
                }`}
              >
                Recognize
              </Link>

              {/* Auth Buttons */}
              <div className="ml-4 flex items-center space-x-2">
                {user ? (
                  <>
                    <span className="text-sm text-gray-400 px-3">{user.email}</span>
                    <button onClick={handleSignOut} className="glass-button text-sm">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button onClick={handleSignIn} className="neon-button text-sm">
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="glass-button p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive('/')
                  ? 'glow-border-pink text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive('/register')
                  ? 'glow-border-pink text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Register
            </Link>
            <Link
              to="/recognize"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive('/recognize')
                  ? 'glow-border-pink text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Recognize
            </Link>

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-white/10 mt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-400">{user.email}</div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="w-full neon-button"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
