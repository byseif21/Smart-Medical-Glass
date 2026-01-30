import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const MultiFaceCapture = ({ onComplete }) => {
  const [stream, setStream] = useState(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const angles = [
    { id: 'front', label: 'Front View', instruction: 'Look straight at the camera' },
    { id: 'left', label: 'Left Profile', instruction: 'Turn your head to the left' },
    { id: 'right', label: 'Right Profile', instruction: 'Turn your head to the right' },
    { id: 'up', label: 'Looking Up', instruction: 'Tilt your head slightly up' },
    { id: 'down', label: 'Looking Down', instruction: 'Tilt your head slightly down' },
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const file = new File([blob], `face-${angles[currentAngle].id}.jpg`, {
          type: 'image/jpeg',
        });
        const newCaptured = { ...capturedImages, [angles[currentAngle].id]: file };
        setCapturedImages(newCaptured);

        // Move to next angle or complete
        if (currentAngle < angles.length - 1) {
          setCurrentAngle(currentAngle + 1);
        } else {
          stopCamera();
          onComplete(newCaptured);
        }
      }
    }, 'image/jpeg');
  };

  const skipAngle = () => {
    if (currentAngle < angles.length - 1) {
      setCurrentAngle(currentAngle + 1);
    } else {
      stopCamera();
      onComplete(capturedImages);
    }
  };

  const retake = () => {
    const newCaptured = { ...capturedImages };
    delete newCaptured[angles[currentAngle].id];
    setCapturedImages(newCaptured);
  };

  const progress = ((currentAngle + 1) / angles.length) * 100;
  const currentAngleData = angles[currentAngle];
  const isCurrentCaptured = capturedImages[currentAngleData.id];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Multi-Angle Face Capture</h3>
        <p className="text-medical-gray-600 text-sm mb-4">
          Capture your face from multiple angles for better recognition accuracy
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-medical-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-medical-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Current Angle Info */}
        <div className="bg-medical-light p-4 rounded-lg mb-4">
          <p className="font-semibold text-medical-dark">
            {currentAngle + 1} of {angles.length}: {currentAngleData.label}
          </p>
          <p className="text-medical-gray-600 text-sm mt-1">{currentAngleData.instruction}</p>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative bg-medical-gray-100 rounded-lg overflow-hidden aspect-video">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Face guide overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="relative w-56 h-72 rounded-[50%] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] overflow-hidden border-2 border-medical-primary/50 box-content">
            <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]"></div>
            <div className="absolute left-0 right-0 h-1 bg-medical-primary/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scan"></div>
          </div>
          <p className="text-white font-medium mt-6 text-sm drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            Position face within frame
          </p>
        </div>

        {/* Captured indicator */}
        {isCurrentCaptured && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Captured
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Captured Angles Preview */}
      <div className="flex gap-2 justify-center flex-wrap">
        {angles.map((angle, index) => (
          <div
            key={angle.id}
            className={`px-3 py-1 rounded-full text-sm ${
              capturedImages[angle.id]
                ? 'bg-green-100 text-green-700'
                : index === currentAngle
                  ? 'bg-medical-primary text-white'
                  : 'bg-medical-gray-200 text-medical-gray-600'
            }`}
          >
            {capturedImages[angle.id] ? '✓' : index + 1} {angle.label}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isCurrentCaptured ? (
          <>
            <button
              onClick={capturePhoto}
              disabled={!stream}
              className="flex-1 btn-medical-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Capture {currentAngleData.label}
            </button>
            <button onClick={skipAngle} className="btn-medical-secondary px-6">
              Skip
            </button>
          </>
        ) : (
          <>
            <button onClick={retake} className="flex-1 btn-medical-secondary">
              Retake
            </button>
            <button
              onClick={() => {
                if (currentAngle < angles.length - 1) {
                  setCurrentAngle(currentAngle + 1);
                } else {
                  stopCamera();
                  onComplete(capturedImages);
                }
              }}
              className="flex-1 btn-medical-primary"
            >
              {currentAngle < angles.length - 1 ? 'Next Angle →' : 'Complete'}
            </button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Info */}
      <div className="bg-medical-light border border-medical-primary/20 rounded-lg p-4">
        <p className="text-medical-gray-700 text-sm">
          <strong>Tip:</strong> Capturing multiple angles improves recognition accuracy by 40-60%.
          You can skip angles, but we recommend capturing at least the front and side views.
        </p>
      </div>
    </div>
  );
};

MultiFaceCapture.propTypes = {
  onComplete: PropTypes.func.isRequired,
};

export default MultiFaceCapture;
