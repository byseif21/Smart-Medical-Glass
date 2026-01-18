import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MultiFaceCapture from '../components/MultiFaceCapture';
import FaceUploader from '../components/FaceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { registerUser } from '../services/api';
import { countries } from '../utils/countries';

const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: info, 2: face
  const [faceMode, setFaceMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '',
    nationality: '',
    gender: '',
    id_number: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.date_of_birth ||
      !formData.gender
    ) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFaceCapture = (imageFiles) => {
    // imageFiles can be either a single file (from FaceUploader) or object with multiple angles (from MultiFaceCapture)
    setCapturedImage(imageFiles);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      setError('Please capture or upload your face photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('date_of_birth', formData.date_of_birth);
      formDataToSend.append('nationality', formData.nationality);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('id_number', formData.id_number);

      // Handle multiple images from MultiFaceCapture or single image from FaceUploader
      if (capturedImage instanceof File) {
        // Single image from FaceUploader
        formDataToSend.append('image', capturedImage);
      } else if (typeof capturedImage === 'object') {
        // Multiple images from MultiFaceCapture
        Object.entries(capturedImage).forEach(([angle, file]) => {
          formDataToSend.append(`image_${angle}`, file);
        });
      }

      const result = await registerUser(formDataToSend);

      if (result.success) {
        // TODO: replace browser alert with GeneralModal component like Connections modal
        // TODO: after successful registration, show custom success modal with next steps
        alert('Registration successful! You can now login.');
        navigate('/login');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-gradient py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/login"
            className="inline-flex items-center text-medical-primary hover:text-cyan-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Login
          </Link>
          <h1 className="text-3xl font-bold text-medical-dark mb-2">New User Registration</h1>
          <p className="text-medical-gray-600">Register your face and personal information</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-medical-primary text-white' : 'bg-medical-gray-200 text-medical-gray-500'}`}
            >
              1
            </div>
            <div
              className={`w-24 h-1 ${step >= 2 ? 'bg-medical-primary' : 'bg-medical-gray-200'}`}
            ></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-medical-primary text-white' : 'bg-medical-gray-200 text-medical-gray-500'}`}
            >
              2
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="medical-card">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
              <p className="text-center text-medical-gray-600 mt-4">Registering...</p>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="label-medical">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-medical"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="label-medical">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-medical"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="label-medical">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-medical"
                    placeholder="e.g. +01234567890"
                  />
                </div>

                <div>
                  <label className="label-medical">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-medical"
                    placeholder="Create a password (min 6 characters)"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-medical">Birthday *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="input-medical"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label className="label-medical">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input-medical"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-medical">Nationality</label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="input-medical"
                  >
                    <option value="">Select Nationality</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-medical">ID Number</label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    className="input-medical"
                    placeholder="National ID or passport number"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button onClick={handleNextStep} className="w-full btn-medical-primary mt-6">
                  Next: Capture Face →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Face Registration</h2>
                <button
                  onClick={() => {
                    setStep(1);
                    setFaceMode(null);
                    setCapturedImage(null);
                  }}
                  className="text-medical-primary hover:text-cyan-700 text-sm"
                >
                  ← Edit Info
                </button>
              </div>

              {!faceMode ? (
                <div className="space-y-4">
                  <p className="text-medical-gray-600 text-center mb-6">
                    Choose how to register your face
                  </p>
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
                    Capture with Camera
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
                    Upload Photo
                  </button>
                </div>
              ) : faceMode === 'capture' ? (
                <div>
                  <button
                    onClick={() => setFaceMode(null)}
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
                  <MultiFaceCapture onComplete={handleFaceCapture} />
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setFaceMode(null)}
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
                  <FaceUploader onUpload={handleFaceCapture} />
                </div>
              )}

              {capturedImage && (
                <div className="mt-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <p className="text-green-600 text-sm text-center">
                      ✓ Face photos captured successfully
                      {typeof capturedImage === 'object' &&
                        !(capturedImage instanceof File) &&
                        ` (${Object.keys(capturedImage).length} angles)`}
                    </p>
                  </div>
                  <button onClick={handleSubmit} className="w-full btn-medical-primary">
                    Complete Registration
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
