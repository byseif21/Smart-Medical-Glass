import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-dark">Face Recognition</h1>
                <p className="text-sm text-medical-gray-600">Smart Glass Recognition System</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn-medical-secondary text-sm px-4 py-2 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                >
                  Admin Panel
                </Link>
              )}
              <Link to="/dashboard" className="btn-medical-secondary text-sm px-4 py-2">
                My Dashboard
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-green-600">✓ Person Recognized</h2>
                <div className="flex gap-2">
                  {showViewProfile && canViewFullProfile && (
                    <button
                      onClick={() => handleViewProfile(recognizedPerson)}
                      className="btn-medical-primary text-sm px-4 py-2"
                    >
                      View Full Profile →
                    </button>
                  )}
                  <button onClick={handleReset} className="btn-medical-secondary text-sm px-4 py-2">
                    Recognize Another
                  </button>
                </div>
              </div>

              <div className="bg-medical-light p-6 rounded-lg">
                <div className="flex items-center gap-4 mb-6">
                  <ProfileAvatar
                    imageUrl={recognizedPerson.profile_picture_url}
                    userName={recognizedPerson.name}
                    size="lg"
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
                          <p className="text-sm font-medium text-red-800">⚠️ Allergies</p>
                          <p className="text-sm text-red-600">
                            {recognizedPerson.medical_info.allergies}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.chronic_conditions && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">Chronic Conditions</p>
                          <p className="text-sm text-yellow-700">
                            {recognizedPerson.medical_info.chronic_conditions}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.current_medications && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Current Medications</p>
                          <p className="text-sm text-blue-700">
                            {recognizedPerson.medical_info.current_medications}
                          </p>
                        </div>
                      )}
                      {recognizedPerson.medical_info.emergency_notes && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">🚨 Emergency Notes</p>
                          <p className="text-sm text-red-600">
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
                    Capture with Smart Glass Camera
                  </button>

                  <button
                    onClick={() => setMode('upload')}
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
                  onClick={() => setMode(null)}
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
          </div>
        )}
      </main>
    </div>
  );
};

export default RecognitionPage;
