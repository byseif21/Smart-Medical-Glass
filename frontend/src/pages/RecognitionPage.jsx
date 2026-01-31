import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ScanFace,
  Shield,
  LayoutDashboard,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Activity,
  Pill,
  Camera,
  Upload,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import FaceCapture from '../components/FaceCapture';
import FaceUploader from '../components/FaceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileAvatar from '../components/ProfileAvatar';
import { getUserRole, setViewingUser, getCurrentUser } from '../services/auth';
import { recognizeFace } from '../services/api';
import { computeAge } from '../utils/dateUtils';

const RecognitionPage = () => {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const canViewFullProfile = userRole === 'doctor' || isAdmin;
  const canViewMedicalInfo = canViewFullProfile;

  const handleFaceSubmit = async (imageFile) => {
    setLoading(true);
    setError('');
    setRecognizedPerson(null);
    setShowViewProfile(false);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const result = await recognizeFace(formData);

      if (result.success && result.data.match) {
        setRecognizedPerson(result.data);
        setShowViewProfile(canViewFullProfile);
      } else {
        setError('Face not recognized. Person may not be registered in the system.');
      }
    } catch (err) {
      setError('An error occurred during recognition. Please try again.');
      console.error('Recognition error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (person) => {
    // Store recognized person's ID and navigate to their dashboard
    const currentUserId = getCurrentUser()?.id;
    setViewingUser(person.user_id || currentUserId, person.name);
    navigate(`/profile/${person.user_id || currentUserId}`);
  };

  const handleReset = () => {
    setMode(null);
    setError('');
    setRecognizedPerson(null);
  };

  return (
    <div className="min-h-screen bg-medical-gradient">
      {/* Header */}
      <header className="bg-white shadow-medical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
                <ScanFace className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-dark">Face Recognition</h1>
                <p className="text-sm text-medical-gray-600">Smart Glass Recognition System</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn-medical-secondary bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100 flex flex-col sm:flex-row items-center justify-center p-1 sm:px-4 sm:py-2 gap-0.5 sm:gap-2 min-w-[50px] sm:min-w-0"
                >
                  <Shield className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="text-[9px] sm:text-sm leading-none sm:leading-normal text-center">
                    Admin Panel
                  </span>
                </Link>
              )}
              <Link
                to="/dashboard"
                className="btn-medical-secondary flex flex-col sm:flex-row items-center justify-center p-1 sm:px-4 sm:py-2 gap-0.5 sm:gap-2 min-w-[50px] sm:min-w-0"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="text-[9px] sm:text-sm leading-none sm:leading-normal text-center">
                  My Dashboard
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {recognizedPerson ? (
          <div className="animate-fade-in">
            {/* Recognition Result */}
            <div className="medical-card mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  Person Recognized
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {showViewProfile && canViewFullProfile && (
                    <button
                      onClick={() => handleViewProfile(recognizedPerson)}
                      className="btn-medical-primary text-sm px-4 py-2 flex items-center justify-center gap-2"
                    >
                      View Full Profile
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="btn-medical-secondary text-sm px-4 py-2 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recognize Another
                  </button>
                </div>
              </div>

              <div className="bg-medical-light p-6 rounded-lg">
                <div className="flex items-center gap-4 mb-6">
                  <ProfileAvatar
                    imageUrl={recognizedPerson.profile_picture_url}
                    userName={recognizedPerson.name}
                    size="xl"
                    clickable={true}
                    className="border-2 border-medical-primary"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-medical-dark">
                      {recognizedPerson.name}
                    </h3>
                    <p className="text-medical-gray-600">
                      Confidence: {(recognizedPerson.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-medical-gray-600">Age</p>
                    <p className="font-medium text-medical-dark">
                      {computeAge(recognizedPerson.date_of_birth) || recognizedPerson.age || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600">Gender</p>
                    <p className="font-medium text-medical-dark capitalize">
                      {recognizedPerson.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600">Nationality</p>
                    <p className="font-medium text-medical-dark">
                      {recognizedPerson.nationality || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600">ID Number</p>
                    <p className="font-medium text-medical-dark">
                      {recognizedPerson.id_number || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Medical Info */}
                {canViewMedicalInfo && recognizedPerson.medical_info && (
                  <div className="border-t border-medical-gray-200 pt-4">
                    <h4 className="font-semibold text-medical-dark mb-3">Medical Information</h4>
                    <div className="space-y-3">
                      {recognizedPerson.medical_info.allergies && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Allergies
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            {recognizedPerson.medical_info.allergies}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.chronic_conditions && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Chronic Conditions
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            {recognizedPerson.medical_info.chronic_conditions}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.current_medications && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            Current Medications
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {recognizedPerson.medical_info.current_medications}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.emergency_notes && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Emergency Notes
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            {recognizedPerson.medical_info.emergency_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {canViewMedicalInfo &&
                  recognizedPerson.emergency_contacts &&
                  recognizedPerson.emergency_contacts.length > 0 && (
                    <div className="border-t border-medical-gray-200 pt-4 mt-4">
                      <h4 className="font-semibold text-medical-dark mb-3">Emergency Contacts</h4>
                      <div className="space-y-2">
                        {recognizedPerson.emergency_contacts.map((relative, index) => (
                          <div
                            key={index}
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
                    </div>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <div className="medical-card">
            {loading ? (
              <div className="py-12">
                <LoadingSpinner />
                <p className="text-center text-medical-gray-600 mt-4">Recognizing face...</p>
              </div>
            ) : mode === null ? (
              <>
                <h2 className="text-2xl font-semibold text-center mb-2">Recognize a Person</h2>
                <p className="text-medical-gray-600 text-center mb-8">
                  Use your smart glass camera or upload a photo to identify someone
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setMode('capture')}
                    className="w-full btn-medical-primary flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-2 text-sm sm:text-base"
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    Capture with Smart Glass Camera
                  </button>

                  <button
                    onClick={() => setMode('upload')}
                    className="w-full btn-medical-secondary flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-2 text-sm sm:text-base"
                  >
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                    Upload Photo
                  </button>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}
              </>
            ) : mode === 'capture' ? (
              <div>
                <button
                  onClick={() => setMode(null)}
                  className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
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
                  onClick={() => setMode(null)}
                  className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
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
          </div>
        )}
      </main>
    </div>
  );
};

export default RecognitionPage;
