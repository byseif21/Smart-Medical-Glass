import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FaceCapture from '../components/FaceCapture';
import FaceUploader from '../components/FaceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileAvatar from '../components/ProfileAvatar';
import { useNotifications } from '../hooks/useNotifications';
import { setSession } from '../services/auth';
import { confirmFaceLogin, loginWithFace } from '../services/api';
import { getTraditionalLoginErrorMessage, getSafeLoginErrorMessage } from '../utils/errorHelpers';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('traditional'); // 'traditional' or 'face'
  const [faceMode, setFaceMode] = useState(null); // 'capture' or 'upload'
  const [faceIdentifiedUser, setFaceIdentifiedUser] = useState(null);
  const [facePassword, setFacePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotifications();

  // Traditional login form
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleCredentialChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      notify({
        type: 'warning',
        title: 'Missing information',
        message: 'Enter both email and password to continue.',
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const detail = data?.detail || data?.error || data?.message;
        const message = getTraditionalLoginErrorMessage({
          err: null,
          status: response.status,
          detail,
        });
        notify({ type: 'error', title: 'Login failed', message });
        setError(message);
        console.error('Login error:', { status: response.status, detail, data });
        return;
      }

      // Store user data
      setSession(data);

      // Redirect to dashboard
      notify({ type: 'success', title: 'Welcome back', message: 'Signed in successfully.' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = getTraditionalLoginErrorMessage({ err });
      notify({ type: 'error', title: 'Login failed', message });
      setError(message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSubmit = async (imageFile) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const result = await loginWithFace(formData);

      if (result.success) {
        setFaceIdentifiedUser(result.data);
        setFacePassword('');
        notify({
          type: 'success',
          title: `Welcome ${result.data?.name || ''}`.trim(),
          message: 'Please enter your password to finish signing in.',
        });
      } else {
        const message = getSafeLoginErrorMessage(
          result.error,
          'Face not recognized. Please try again or use email login.'
        );
        notify({ type: 'error', title: 'Face login failed', message });
        setError(message);
      }
    } catch (err) {
      const message = 'An error occurred during face login. Please try again.';
      notify({ type: 'error', title: 'Face login failed', message });
      setError(message);
      console.error('Face login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceConfirm = async (e) => {
    e.preventDefault();

    if (!faceIdentifiedUser?.user_id) {
      const message = 'Face session expired. Please try again.';
      notify({ type: 'error', title: 'Face login failed', message });
      setError(message);
      setFaceIdentifiedUser(null);
      setFaceMode(null);
      return;
    }

    if (!facePassword) {
      const message = 'Please enter your password to continue.';
      notify({ type: 'warning', title: 'Password required', message });
      setError(message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await confirmFaceLogin({
        userId: faceIdentifiedUser.user_id,
        password: facePassword,
      });
      if (!result.success) {
        const message = getSafeLoginErrorMessage(
          result.error,
          'Invalid password. Please try again.'
        );
        notify({ type: 'error', title: 'Login failed', message });
        setError(message);
        return;
      }

      setSession(result.data);
      notify({ type: 'success', title: 'Welcome back', message: 'Signed in successfully.' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = 'Login failed. Please try again.';
      notify({ type: 'error', title: 'Login failed', message });
      setError(message);
      console.error('Face confirm error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setFaceMode(null);
    setFaceIdentifiedUser(null);
    setFacePassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-medical-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-medical-primary rounded-full mb-4 shadow-medical-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-medical-dark mb-2">Smart Glass AI</h1>
          <p className="text-medical-gray-600">Medical Edition</p>
        </div>

        {/* Login Method Tabs */}
        <div className="medical-card mb-4">
          <div className="flex gap-2 p-1 bg-medical-gray-100 rounded-lg">
            <button
              onClick={() => {
                setLoginMethod('traditional');
                setFaceMode(null);
                setFaceIdentifiedUser(null);
                setFacePassword('');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                loginMethod === 'traditional'
                  ? 'bg-white text-medical-primary shadow-medical'
                  : 'text-medical-gray-600 hover:text-medical-dark'
              }`}
            >
              Email Login
            </button>
            <button
              onClick={() => {
                setLoginMethod('face');
                setFaceIdentifiedUser(null);
                setFacePassword('');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                loginMethod === 'face'
                  ? 'bg-white text-medical-primary shadow-medical'
                  : 'text-medical-gray-600 hover:text-medical-dark'
              }`}
            >
              Face ID
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="medical-card animate-slide-up">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
              <p className="text-center text-medical-gray-600 mt-4">Authenticating...</p>
            </div>
          ) : loginMethod === 'traditional' ? (
            <>
              <h2 className="text-2xl font-semibold text-center mb-6">Login to Your Account</h2>

              <form onSubmit={handleTraditionalLogin} className="space-y-4">
                <div>
                  <label className="label-medical">Email or ID Number</label>
                  <input
                    type="text"
                    name="email"
                    value={credentials.email}
                    onChange={handleCredentialChange}
                    className="input-medical"
                    placeholder="Enter your email or ID"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="label-medical">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleCredentialChange}
                    className="input-medical"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <button type="submit" className="w-full btn-medical-primary">
                  Login
                </button>
              </form>

              <div className="mt-4 text-center">
                <a href="#" className="text-medical-primary hover:text-cyan-700 text-sm">
                  Forgot password?
                </a>
              </div>
            </>
          ) : faceIdentifiedUser ? (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Not you? Try again
              </button>

              <div className="flex flex-col items-center text-center">
                <ProfileAvatar
                  imageUrl={faceIdentifiedUser.profile_picture_url}
                  userName={faceIdentifiedUser.name}
                  size="lg"
                  clickable={false}
                  className="shadow-medical-lg"
                />
                <h2 className="text-2xl font-semibold mt-5">{`Welcome ${faceIdentifiedUser.name}`}</h2>
                <p className="text-medical-gray-600 mt-2">
                  Face verified. Enter your password to finish signing in.
                </p>
              </div>

              <form onSubmit={handleFaceConfirm} className="space-y-4 mt-6">
                <div>
                  <label className="label-medical">Password</label>
                  <input
                    type="password"
                    name="facePassword"
                    value={facePassword}
                    onChange={(e) => setFacePassword(e.target.value)}
                    className="input-medical"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <button type="submit" className="w-full btn-medical-primary">
                  Confirm Login
                </button>
              </form>
            </div>
          ) : faceMode === null ? (
            <>
              <h2 className="text-2xl font-semibold text-center mb-2">Login with Face ID</h2>
              <p className="text-medical-gray-600 text-center mb-8">
                Authenticate using your registered face
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setFaceMode('capture')}
                  className="w-full btn-medical-primary flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Capture Face with Camera
                </button>

                <button
                  onClick={() => setFaceMode('upload')}
                  className="w-full btn-medical-secondary flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Face Photo
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          ) : faceMode === 'capture' ? (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <FaceCapture onCapture={handleFaceSubmit} />
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <FaceUploader onUpload={handleFaceSubmit} />
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-medical-gray-200 text-center">
            <p className="text-medical-gray-600 text-sm mb-3">Don&apos;t have an account?</p>
            <Link to="/register" className="text-medical-primary hover:text-cyan-700 font-medium">
              Register New User →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-medical-gray-500 text-sm mt-6">
          Secure medical authentication system
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
