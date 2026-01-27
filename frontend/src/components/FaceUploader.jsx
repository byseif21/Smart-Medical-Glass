import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const FaceUploader = ({ onUpload, isLoading = false }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (isLoading) return;
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">Upload Your Face Photo</h3>
      <p className="text-medical-gray-600 text-center text-sm">Select a clear photo of your face</p>

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-medical-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-medical-primary hover:bg-medical-light/50 transition-all duration-200"
        >
          <svg
            className="w-16 h-16 mx-auto text-medical-gray-400 mb-4"
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
          <p className="text-medical-gray-600 mb-2">Click to select a photo</p>
          <p className="text-medical-gray-400 text-sm">JPEG, PNG (max 5MB)</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-medical-gray-100 rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-auto object-contain max-h-96" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 btn-medical-secondary"
              disabled={isLoading}
            >
              Change Photo
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 btn-medical-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Authenticate'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Tips */}
      <div className="bg-medical-light border border-medical-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-medical-dark mb-2 text-sm">Photo Tips:</h4>
        <ul className="text-medical-gray-600 text-sm space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-medical-accent mt-0.5">✓</span>
            <span>Use a clear, well-lit photo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-medical-accent mt-0.5">✓</span>
            <span>Face should be clearly visible and centered</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-medical-accent mt-0.5">✓</span>
            <span>Avoid sunglasses or face coverings</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

FaceUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
};

export default FaceUploader;
