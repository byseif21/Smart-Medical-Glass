import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, RefreshCw, ScanFace } from 'lucide-react';

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
          className="border-2 border-dashed border-medical-gray-300 rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-medical-primary hover:bg-medical-light/50 transition-all duration-200"
        >
          <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-medical-gray-400 mb-4" />
          <p className="text-medical-gray-600 mb-2">Click to select a photo</p>
          <p className="text-medical-gray-400 text-sm">JPEG, PNG (max 5MB)</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-medical-gray-100 rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-auto object-contain max-h-96" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClear}
              className="w-full sm:flex-1 btn-medical-secondary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              Change Photo
            </button>
            <button
              onClick={handleUpload}
              className="w-full sm:flex-1 btn-medical-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4 sm:w-5 sm:h-5" />
                  Authenticate
                </>
              )}
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
