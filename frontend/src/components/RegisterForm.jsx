import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { registerUser } from '../services/api';
import '../styles/glassmorphism.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    email: '',
    phone: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          image: 'Please upload a valid image file (JPEG or PNG)',
        }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          image: 'Image size must be less than 5MB',
        }));
        return;
      }

      setImageFile(file);
      setErrors((prev) => ({
        ...prev,
        image: '',
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.job.trim()) {
      newErrors.job = 'Job/Role is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!imageFile) {
      newErrors.image = 'Face photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        image: imageFile,
      };

      const response = await registerUser(userData);

      if (response.success) {
        setSuccessMessage(`Registration successful! User ID: ${response.data.user_id || 'N/A'}`);
        // Reset form
        setFormData({
          name: '',
          job: '',
          email: '',
          phone: '',
        });
        setImageFile(null);
        setImagePreview(null);
      } else {
        setErrorMessage(response.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 neon-gradient-text">Register New User</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-white font-medium mb-2">
            Full Name <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="glass-input w-full"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-pink-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Job Field */}
        <div>
          <label htmlFor="job" className="block text-white font-medium mb-2">
            Job/Role <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="job"
            name="job"
            value={formData.job}
            onChange={handleInputChange}
            className="glass-input w-full"
            placeholder="Enter your job title or role"
          />
          {errors.job && <p className="text-pink-500 text-sm mt-1">{errors.job}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-white font-medium mb-2">
            Email Address <span className="text-pink-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="glass-input w-full"
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-pink-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-white font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="glass-input w-full"
            placeholder="Enter your phone number (optional)"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="block text-white font-medium mb-2">
            Face Photo <span className="text-pink-500">*</span>
          </label>
          <div className="space-y-4">
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="hidden"
            />
            <label htmlFor="image" className="glass-button block text-center cursor-pointer">
              {imageFile ? 'Change Photo' : 'Upload Photo'}
            </label>
            {errors.image && <p className="text-pink-500 text-sm">{errors.image}</p>}

            {/* Image Preview */}
            {imagePreview && (
              <div className="glass-card p-4">
                <p className="text-white text-sm mb-2">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-xs mx-auto rounded-lg glow-border-pink"
                />
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="glass-card p-4 border-2 border-green-500">
            <p className="text-green-400 text-center font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="glass-card p-4 border-2 border-pink-500">
            <p className="text-pink-400 text-center font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && <LoadingSpinner message="Registering user..." />}

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="neon-button w-full text-lg">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
