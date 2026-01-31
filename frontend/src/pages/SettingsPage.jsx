import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  ScanFace,
  Key,
  ArrowLeft,
  Camera,
  Upload,
  ChevronLeft,
  Eye,
  EyeOff,
  Check,
  FileText,
  Phone,
  Calendar,
  Flag,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import FaceUploader from '../components/FaceUploader';
import MultiFaceCapture from '../components/MultiFaceCapture';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import {
  updateFaceEnrollment,
  updateProfilePicture,
  getProfile,
  updatePrivacySettings,
  changePassword,
  deleteAccount,
} from '../services/api';
import { getCurrentUser, clearSession } from '../services/auth';
import { defaultPrivacySettings } from '../utils/constants';
import { changePasswordSchema, validateWithSchema } from '../utils/validation';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [privacySettings, setPrivacySettings] = useState(defaultPrivacySettings);
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { notify } = useNotifications();

  const currentUser = getCurrentUser();
  const userId = currentUser?.id;

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      notify({
        type: 'warning',
        title: 'Password Required',
        message: 'Please enter your password to confirm account deletion.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount(deletePassword);
      if (result.success) {
        notify({
          type: 'success',
          title: 'Account Deleted',
          message: 'Your account has been permanently deleted.',
        });
        clearSession();
        navigate('/login', { replace: true });
      } else {
        notify({
          type: 'error',
          title: 'Deletion Failed',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('Delete account error:', err);
      notify({
        type: 'error',
        title: 'Unexpected Error',
        message: 'An error occurred while deleting your account.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    try {
      const result = await getProfile(userId);
      if (result.success) {
        if (result.data.face_updated_at) {
          setFaceLastUpdated(result.data.face_updated_at);
        }
        if (result.data.profile_picture_url) {
          setProfilePictureUrl(result.data.profile_picture_url);
        }
        const loadedSettings = Object.keys(defaultPrivacySettings).reduce((acc, key) => {
          acc[key] = result.data[key] ?? defaultPrivacySettings[key];
          return acc;
        }, {});
        setPrivacySettings(loadedSettings);
      }
    } catch (err) {
      console.error('Failed to fetch profile settings:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    fetchProfile();
  }, [userId, navigate, fetchProfile]);

  const handlePrivacyUpdate = async (key, value) => {
    // Optimistic update
    const prevSettings = { ...privacySettings };
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));

    const result = await updatePrivacySettings(userId, { [key]: value });

    if (result.success) {
      notify({
        type: 'success',
        title: 'Privacy Updated',
        message: 'Your privacy settings have been saved.',
      });
    } else {
      // Revert on failure
      setPrivacySettings(prevSettings);
      notify({
        type: 'error',
        title: 'Update Failed',
        message: result.error || 'Could not update privacy settings.',
      });
    }
  };

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

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateWithSchema(changePasswordSchema, passwordForm);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      notify({
        type: 'error',
        title: 'Validation Error',
        message: firstError,
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been changed successfully.',
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsPasswordFormVisible(false);
      } else {
        notify({
          type: 'error',
          title: 'Update Failed',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('Password change error:', err);
      notify({
        type: 'error',
        title: 'Unexpected Error',
        message: 'An error occurred while changing your password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordForm.newPassword.length >= 8 },
    { label: 'At least one number', met: /\d/.test(passwordForm.newPassword) },
    { label: 'At least one letter', met: /[a-zA-Z]/.test(passwordForm.newPassword) },
  ];

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
              <Link
                to="/dashboard"
                className="btn-medical-secondary text-sm px-4 py-2 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
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
              onClick={() => setActiveSection('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border flex items-center gap-3 transition-colors ${
                activeSection === 'profile'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              <User className="w-5 h-5" />
              Profile Picture
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('privacy')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border flex items-center gap-3 transition-colors ${
                activeSection === 'privacy'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              <Shield className="w-5 h-5" />
              Privacy Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('device')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border flex items-center gap-3 transition-colors ${
                activeSection === 'device'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              <ScanFace className="w-5 h-5" />
              Smart Glass Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border flex items-center gap-3 transition-colors ${
                activeSection === 'security'
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-white text-medical-gray-700 border-medical-gray-200 hover:bg-medical-gray-50'
              }`}
            >
              <Key className="w-5 h-5" />
              Security & Face ID
            </button>
          </aside>

          <section className="space-y-6">
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

            {activeSection === 'privacy' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Privacy Settings</h2>
                    <p className="text-sm text-medical-gray-600">
                      Control what information is visible to other users when they recognize your
                      face. Doctors and admins will always have full access.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Master Privacy Switch */}
                  <div
                    className={`flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white ${isLoadingProfile ? 'opacity-60' : ''}`}
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-medical-primary" />
                        Public Profile Visibility
                      </h3>
                      <p className="text-sm text-medical-gray-600">
                        {privacySettings.is_name_public
                          ? 'Your profile is visible to others. You can customize what details are shown below.'
                          : 'Private Mode enabled. Your name is hidden and all other details are automatically concealed from public users.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={privacySettings.is_name_public}
                        disabled={isLoadingProfile}
                        onChange={(e) => handlePrivacyUpdate('is_name_public', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                    </label>
                  </div>

                  {/* Granular Settings - Disabled if Public Profile is OFF or Loading */}
                  <div
                    className={`space-y-4 transition-opacity duration-200 ${!privacySettings.is_name_public || isLoadingProfile ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <h4 className="font-medium text-medical-dark pt-2">
                      Detailed Visibility Settings
                    </h4>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-medical-primary" />
                          Show Government ID
                        </h3>
                        <p className="text-sm text-medical-gray-600">
                          Allow others to see your ID number (Default: Hidden).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_id_number_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_id_number_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-medical-primary" />
                          Show Phone Number
                        </h3>
                        <p className="text-sm text-medical-gray-600">
                          Allow others to see your phone number.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_phone_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_phone_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    {/*<div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900">Show Email Address</h3>
                        <p className="text-sm text-medical-gray-600">Allow others to see your email address.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={privacySettings.is_name_public && privacySettings.is_email_public}
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_email_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>*/}

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-medical-primary" />
                          Show Age
                        </h3>
                        <p className="text-sm text-medical-gray-600">
                          Allow others to see your age.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={privacySettings.is_name_public && privacySettings.is_dob_public}
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_dob_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-medical-primary" />
                          Show Gender
                        </h3>
                        <p className="text-sm text-medical-gray-600">
                          Allow others to see your gender.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_gender_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_gender_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 rounded-lg bg-white">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <Flag className="w-4 h-4 text-medical-primary" />
                          Show Nationality
                        </h3>
                        <p className="text-sm text-medical-gray-600">
                          Allow others to see your nationality.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_nationality_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_nationality_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>
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

            {activeSection === 'security' && (
              <>
                <div className="medical-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                        <ScanFace className="w-6 h-6 text-medical-primary" />
                        Face ID
                      </h2>
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
                            <Camera className="w-6 h-6" />
                            Capture Multi-Angle Face
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaceMode('upload')}
                            className="w-full btn-medical-secondary flex items-center justify-center gap-3"
                          >
                            <Upload className="w-6 h-6" />
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
                          <ChevronLeft className="w-5 h-5" />
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
                          <ChevronLeft className="w-5 h-5" />
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
                        face template does not change your name, medical data, or emergency
                        contacts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="medical-card mt-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                        <Key className="w-6 h-6 text-medical-primary" />
                        Password
                      </h2>
                      <p className="text-sm text-medical-gray-600">
                        Update your account password to keep your account secure.
                      </p>
                    </div>

                    {!isPasswordFormVisible && (
                      <button
                        type="button"
                        onClick={() => setIsPasswordFormVisible(true)}
                        className="btn-medical-secondary"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {isPasswordFormVisible && (
                    <div className="bg-medical-gray-50/50 rounded-xl p-6 border border-medical-gray-100">
                      <form onSubmit={submitPasswordChange} className="space-y-4 max-w-md">
                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10"
                              placeholder="Enter current password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10"
                              placeholder="Enter new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {/* Password Requirements Checklist */}
                          <div className="mt-3 space-y-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              Password must contain:
                            </p>
                            {passwordRequirements.map((req, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                                  req.met ? 'text-green-600 font-medium' : 'text-gray-500'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                                    req.met
                                      ? 'bg-green-100 border-green-500'
                                      : 'bg-gray-50 border-gray-300'
                                  }`}
                                >
                                  {req.met && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span>{req.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10"
                              placeholder="Confirm new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="btn-medical-primary flex-1 py-2.5 shadow-sm"
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? 'Updating...' : 'Update Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPasswordFormVisible(false);
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            className="btn-medical-secondary flex-1 py-2.5 bg-white hover:bg-gray-50"
                            disabled={isChangingPassword}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                <div className="medical-card mt-6 border-red-100 bg-red-50/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold mb-1 text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Danger Zone
                      </h2>
                      <p className="text-sm text-red-600/80">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-medical-lg w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-red-600 mb-1">Delete Account</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? All of your data, including medical
                info, connections, and face data will be permanently removed.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="label-medical text-gray-700">Confirm with Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input-medical w-full border-red-300 focus:border-red-500 focus:ring-red-200"
                    placeholder="Enter your password"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <LoadingSpinner size="sm" color="text-white" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
