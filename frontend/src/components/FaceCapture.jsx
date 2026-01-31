import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Camera, RefreshCw } from 'lucide-react';

const overlayStyles = {
  sm: {
    overlay: 'w-28 h-36 sm:w-32 sm:h-44',
    container: 'aspect-[4/3]',
    text: 'mt-3 text-xs',
  },
  lg: {
    overlay: 'w-48 h-64 sm:w-56 sm:h-72 md:w-64 md:h-80',
    container: 'aspect-video',
    text: 'mt-6 text-sm',
  },
};

const FaceCapture = ({ onCapture, variant = 'lg' }) => {
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // styles based on variant, fallback to 'lg' if invalid
  const styles = overlayStyles[variant] || overlayStyles.lg;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-face.jpg', { type: 'image/jpeg' });
        setCaptured(true);
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg');
  };

  const retake = () => {
    setCaptured(false);
    startCamera();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">Capture Your Face</h3>
      <p className="text-medical-gray-600 text-center text-sm">
        Position your face in the center and click capture
      </p>

      <div
        className={`relative bg-medical-gray-100 rounded-lg overflow-hidden ${styles.container}`}
      >
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div
                className={`relative ${styles.overlay} rounded-[50%] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] overflow-hidden border-2 border-medical-primary/50 box-content transition-all duration-300`}
              >
                <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]"></div>
                <div className="absolute left-0 right-0 h-1 bg-medical-primary/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scan"></div>
              </div>
              <p
                className={`text-white font-medium ${styles.text} drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10`}
              >
                Position face within frame
              </p>
            </div>
          </>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!captured ? (
          <button
            onClick={capturePhoto}
            disabled={!stream}
            className="flex-1 btn-medical-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            Capture Photo
          </button>
        ) : (
          <button
            onClick={retake}
            className="flex-1 btn-medical-secondary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            Retake Photo
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

FaceCapture.propTypes = {
  onCapture: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['sm', 'lg']),
};

export default FaceCapture;
