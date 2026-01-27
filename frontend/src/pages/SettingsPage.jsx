import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FaceUploader from '../components/FaceUploader';
import MultiFaceCapture from '../components/MultiFaceCapture';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { getCurrentUser } from '../services/auth';
import { updateFaceEnrollment, updateProfilePicture, getProfile } from '../services/api';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('security');
  const [faceMode, setFaceMode] = useState(null);
  const [facePassword, setFacePassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFaceImages, setPendingFaceImages] = useState(null);
  const [isSubmittingFace, setIsSubmittingFace] = useState(false);
  const [isSubmittingAvatar, setIsSubmittingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [faceLastUpdated, setFaceLastUpdated] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const navigate = useNavigate();
  const { notify } = useNotifications();

  const currentUser = getCurrentUser();
  const userId = currentUser?.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await getProfile(userId);
      if (result.success) {
        if (result.data.face_updated_at) {
          setFaceLastUpdated(result.data.face_updated_at);
        }
        if (result.data.profile_picture_url) {
          setProfilePictureUrl(result.data.profile_picture_url);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile settings:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    fetchProfile();
  }, [userId, navigate, fetchProfile]);

  const handleFaceCaptureComplete = async (imageFiles) => {
    const hasFiles =
      imageFiles instanceof File ||
      (imageFiles && typeof imageFiles === 'object' && Object.keys(imageFiles).length > 0);

    if (!hasFiles) {
      notify({
        type: 'error',
        title: 'No images captured',
        message: 'Please capture or upload at least one face image.',
      });
      return;
    }

    setPendingFaceImages(imageFiles);
    setShowPasswordModal(true);
  };

  const handleConfirmFaceUpdate = async () => {
    if (!facePassword) {
      notify({
        type: 'warning',
        title: 'Password required',
        message: 'Please enter your account password before updating Face ID.',
      });
      return;
    }

    setIsSubmittingFace(true);

    try {
      const formData = new FormData();
      formData.append('password', facePassword);

      if (pendingFaceImages instanceof File) {
        formData.append('image', pendingFaceImages);
      } else {
        Object.entries(pendingFaceImages).forEach(([angle, file]) => {
          formData.append(`image_${angle}`, file);
        });
      }

      const result = await updateFaceEnrollment(currentUser.id, formData);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Face ID updated',
          message: 'Your face template has been refreshed successfully.',
        });
        setFaceLastUpdated(new Date().toISOString());
        setFacePassword('');
        setFaceMode(null);
        setShowPasswordModal(false);
        setPendingFaceImages(null);
      } else {
        notify({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Could not update your Face ID. Please try again.',
        });
      }
    } catch (err) {
      console.error('Face enrollment update error:', err);
      notify({
        type: 'error',
        title: 'Unexpected error',
        message: 'An error occurred while updating your Face ID. Please try again.',
      });
    } finally {
      setIsSubmittingFace(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setSelectedAvatarFile(file);

    const formData = new FormData();
    formData.append('image', file);

    setIsSubmittingAvatar(true);

    try {
      const result = await updateProfilePicture(currentUser.id, formData);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Profile picture updated',
          message: 'Your profile photo has been updated successfully.',
        });
        setSelectedAvatarFile(null);
        setUploaderKey((prev) => prev + 1);
        fetchProfile();
      } else {
        notify({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Could not update your profile picture.',
        });
      }
    } catch (err) {
      console.error('Profile picture update error:', err);
      notify({
        type: 'error',
        title: 'Unexpected error',
        message: 'An error occurred while updating your profile picture.',
      });
    } finally {
      setIsSubmittingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-gradient">
      <header className="bg-white shadow-medical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar imageUrl={null} userName={currentUser?.name} size="md" />
              <div>
                <h1 className="text-xl font-bold text-medical-dark">Account Settings</h1>
                <p className="text-sm text-medical-gray-600">
                  Manage your Face ID, profile photo, and smart glass preferences.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-medical-secondary text-sm px-4 py-2">
                ← Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px,1fr] gap-6">
          <aside className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border ${
                activeSection === 'security'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              Security & Face ID
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border ${
                activeSection === 'profile'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              Profile Picture
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('device')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border ${
                activeSection === 'device'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              Smart Glass Preferences
            </button>
          </aside>

          <section className="space-y-6">
            {activeSection === 'security' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Face ID</h2>
                    <p className="text-sm text-medical-gray-600">
                      Re-register your face to keep recognition accurate. For security, we require
                      your password before updating your face template.
                    </p>
                    <p className="text-xs text-medical-gray-500 mt-2">
                      {faceLastUpdated ? (
                        <>
                          Last updated: {new Date(faceLastUpdated).toLocaleDateString()} at{' '}
                          {new Date(faceLastUpdated).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      ) : (
                        'Last updated: Not available'
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {!faceMode ? (
                    <div className="space-y-4">
                      <p className="text-medical-gray-600 text-sm">
                        Choose how you want to update your Face ID.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFaceMode('capture')}
                          className="w-full btn-medical-primary flex items-center justify-center gap-3"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                          Capture Multi-Angle Face
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaceMode('upload')}
                          className="w-full btn-medical-secondary flex items-center justify-center gap-3"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Upload New Face Photo
                        </button>
                      </div>
                    </div>
                  ) : faceMode === 'capture' ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setFaceMode(null)}
                        className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Back
                      </button>
                      <MultiFaceCapture onComplete={handleFaceCaptureComplete} />
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setFaceMode(null)}
                        className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Back
                      </button>
                      <FaceUploader onUpload={handleFaceCaptureComplete} />
                    </div>
                  )}

                  {isSubmittingFace && (
                    <div className="mt-4">
                      <LoadingSpinner text="Updating Face ID..." />
                    </div>
                  )}

                  <div className="mt-4 bg-medical-light border border-medical-primary/20 rounded-lg p-4">
                    <p className="text-medical-gray-700 text-sm">
                      Face ID settings are separate from your personal information. Updating your
                      face template does not change your name, medical data, or emergency contacts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Profile Picture</h2>
                    <p className="text-sm text-medical-gray-600">
                      Choose a new profile photo. This is used in the dashboard and recognition
                      results but does not change your medical information.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <ProfileAvatar
                      imageUrl={profilePictureUrl}
                      userName={currentUser?.name}
                      size="lg"
                      clickable={false}
                      className="shadow-medical-lg"
                    />
                    <p className="text-sm text-medical-gray-600 text-center">
                      Current profile picture as seen in your dashboard and recognition cards.
                    </p>
                  </div>

                  <div>
                    <FaceUploader
                      key={uploaderKey}
                      onUpload={handleAvatarUpload}
                      isLoading={isSubmittingAvatar}
                    />
                    {isSubmittingAvatar && (
                      <div className="mt-4">
                        <LoadingSpinner text="Saving new profile picture..." />
                      </div>
                    )}
                    {selectedAvatarFile && !isSubmittingAvatar && (
                      <p className="mt-3 text-sm text-medical-gray-600">
                        Selected file: {selectedAvatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'device' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Smart Glass Preferences</h2>
                    <p className="text-sm text-medical-gray-600">
                      Configure how notifications and medical information should appear on your
                      smart medical glasses. These options are placeholders and will be connected to
                      the device integration later.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-medical-dark">
                        Show basic profile on recognize
                      </p>
                      <p className="text-sm text-medical-gray-600">
                        Display name and age only when someone is recognized.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 cursor-not-allowed opacity-60"
                    >
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow translate-x-1" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-medical-dark">Show medical alerts only</p>
                      <p className="text-sm text-medical-gray-600">
                        Limit glass alerts to critical medical warnings for safety.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 cursor-not-allowed opacity-60"
                    >
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow translate-x-1" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-medical-dark">Emergency contact shortcut</p>
                      <p className="text-sm text-medical-gray-600">
                        Enable a one-tap shortcut on the glasses to show emergency contacts for the
                        current patient.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 cursor-not-allowed opacity-60"
                    >
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow translate-x-1" />
                    </button>
                  </div>

                  <div className="mt-4 bg-medical-light border border-medical-primary/20 rounded-lg p-4">
                    <p className="text-medical-gray-700 text-sm">
                      These smart glass settings will be wired to the hardware integration later.
                      For now, they are just preparing the UX and do not change any stored profile
                      data, so there is no duplication with your main information.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-medical-lg w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-medical-dark mb-2">Confirm Security Update</h3>
              <p className="text-medical-gray-600 mb-6">
                Please enter your account password to confirm the update to your Face ID template.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label-medical">Password</label>
                  <input
                    type="password"
                    value={facePassword}
                    onChange={(e) => setFacePassword(e.target.value)}
                    className="input-medical w-full"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setFacePassword('');
                      setPendingFaceImages(null);
                    }}
                    className="btn-medical-secondary"
                    disabled={isSubmittingFace}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFaceUpdate}
                    className="btn-medical-primary"
                    disabled={isSubmittingFace}
                  >
                    {isSubmittingFace ? 'Updating...' : 'Confirm & Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
