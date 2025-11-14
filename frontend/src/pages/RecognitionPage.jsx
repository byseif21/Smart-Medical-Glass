import { useState } from 'react';
import { recognizeFace } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PersonCard from '../components/PersonCard';
import '../styles/glassmorphism.css';

const RecognitionPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setRecognitionResult(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle recognition submission
  const handleRecognize = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsRecognizing(true);
    setError(null);
    setRecognitionResult(null);

    try {
      const result = await recognizeFace(selectedImage);

      if (result.success) {
        setRecognitionResult(result.data);
      } else {
        setError(result.error || 'Recognition failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Recognition error:', err);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRecognitionResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen animated-gradient-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="neon-gradient-text">Face Recognition</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Upload a photo to test the face recognition system. The AI will identify registered
            users and display their information.
          </p>
        </div>

        {/* Upload Section */}
        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Upload Test Photo
          </h2>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-6 flex justify-center">
              <div className="glow-border-blue rounded-lg overflow-hidden max-w-md">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            </div>
          )}

          {/* File Input */}
          <div className="mb-6">
            <label
              htmlFor="image-upload"
              className="block w-full cursor-pointer"
            >
              <div className="glass-card-dark hover:glow-border-pink transition-all duration-300 p-8 text-center rounded-lg border-2 border-dashed border-white/20">
                <div className="flex flex-col items-center space-y-3">
                  <svg
                    className="w-16 h-16 text-pink-500"
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
                  <div>
                    <p className="text-white font-medium">
                      {selectedImage ? selectedImage.name : 'Click to upload image'}
                    </p>
                    <p className="text-white/60 text-sm mt-1">JPEG or PNG (max 5MB)</p>
                  </div>
                </div>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRecognize}
              disabled={!selectedImage || isRecognizing}
              className="glow-button-pink px-8 py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isRecognizing ? 'Recognizing...' : 'Recognize Face'}
            </button>

            {(selectedImage || recognitionResult) && (
              <button
                onClick={handleReset}
                disabled={isRecognizing}
                className="glass-card-dark hover:glow-border-blue px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isRecognizing && (
          <div className="glass-card p-8">
            <LoadingSpinner size="lg" message="Analyzing face..." />
          </div>
        )}

        {/* Error Message */}
        {error && !isRecognizing && (
          <div className="glass-card p-6 border-2 border-red-500/50 bg-red-500/10">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-red-500 font-semibold mb-1">Recognition Error</h3>
                <p className="text-white/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recognition Results */}
        {recognitionResult && !isRecognizing && (
          <div className="space-y-6">
            {recognitionResult.recognized ? (
              <PersonCard
                user={recognitionResult.user}
                confidence={recognitionResult.confidence}
              />
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-blue-400/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Not Recognized</h3>
                    <p className="text-white/70">
                      No matching face found in the database. Please try registering first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="glass-card mt-8 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recognition Tips:</h3>
          <ul className="text-white/80 space-y-2">
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>Use a clear, well-lit photo similar to your registration photo</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Ensure your face is clearly visible and centered</span>
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>The system works best with frontal face photos</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Recognition accuracy depends on image quality and lighting</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecognitionPage;
