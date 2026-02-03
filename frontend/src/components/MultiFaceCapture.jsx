import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { SwitchCamera } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';

const angles = [
  { id: 'front', label: 'Front View', instruction: 'Look straight at the camera' },
  { id: 'left', label: 'Left Profile', instruction: 'Turn your head to the left' },
  { id: 'right', label: 'Right Profile', instruction: 'Turn your head to the right' },
  { id: 'up', label: 'Looking Up', instruction: 'Tilt your head slightly up' },
  { id: 'down', label: 'Looking Down', instruction: 'Tilt your head slightly down' },
];

const useMultiCapture = (captureImage, stopCamera, onComplete) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});

  const handleCapture = async () => {
    try {
      const currentAngleId = angles[currentAngle].id;
      const file = await captureImage(`face-${currentAngleId}.jpg`);

      const newCaptured = { ...capturedImages, [currentAngleId]: file };
      setCapturedImages(newCaptured);

      if (currentAngle < angles.length - 1) {
        setCurrentAngle(currentAngle + 1);
      } else {
        stopCamera();
        onComplete(newCaptured);
      }
    } catch (err) {
      console.error('Capture failed:', err);
    }
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

  const nextStep = () => {
    if (currentAngle < angles.length - 1) {
      setCurrentAngle(currentAngle + 1);
    } else {
      stopCamera();
      onComplete(capturedImages);
    }
  };

  return {
    currentAngle,
    capturedImages,
    handleCapture,
    skipAngle,
    retake,
    nextStep,
  };
};

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-medical-gray-200 rounded-full h-2 mb-4">
    <div
      className="bg-medical-primary h-2 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

ProgressBar.propTypes = { progress: PropTypes.number.isRequired };

const CurrentAngleInfo = ({ index, total, label, instruction }) => (
  <div className="bg-medical-light p-4 rounded-lg mb-4">
    <p className="font-semibold text-medical-dark">
      {index + 1} of {total}: {label}
    </p>
    <p className="text-medical-gray-600 text-sm mt-1">{instruction}</p>
  </div>
);

CurrentAngleInfo.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  instruction: PropTypes.string.isRequired,
};

const FaceGuideOverlay = ({ isCaptured }) => (
  <>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
      <div className="relative w-56 h-72 rounded-[50%] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] overflow-hidden border-2 border-medical-primary/50 box-content">
        <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]"></div>
        <div className="absolute left-0 right-0 h-1 bg-medical-primary/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scan"></div>
      </div>
      <p className="text-white font-medium mt-6 text-sm drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
        Position face within frame
      </p>
    </div>
    {isCaptured && (
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
        ✓ Captured
      </div>
    )}
  </>
);

FaceGuideOverlay.propTypes = { isCaptured: PropTypes.bool };

const CapturedAnglesList = ({ angles, capturedImages, currentAngle }) => (
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
);

CapturedAnglesList.propTypes = {
  angles: PropTypes.array.isRequired,
  capturedImages: PropTypes.object.isRequired,
  currentAngle: PropTypes.number.isRequired,
};

const CaptureControls = ({
  isCaptured,
  hasStream,
  onCapture,
  onSkip,
  onRetake,
  onNext,
  isLastStep,
  currentLabel,
}) => (
  <div className="flex gap-3">
    {!isCaptured ? (
      <>
        <button
          onClick={onCapture}
          disabled={!hasStream}
          className="flex-1 btn-medical-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Capture {currentLabel}
        </button>
        <button onClick={onSkip} className="btn-medical-secondary px-6">
          Skip
        </button>
      </>
    ) : (
      <>
        <button onClick={onRetake} className="flex-1 btn-medical-secondary">
          Retake
        </button>
        <button onClick={onNext} className="flex-1 btn-medical-primary">
          {!isLastStep ? 'Next Angle →' : 'Complete'}
        </button>
      </>
    )}
  </div>
);

CaptureControls.propTypes = {
  isCaptured: PropTypes.bool,
  hasStream: PropTypes.bool,
  onCapture: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onRetake: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  currentLabel: PropTypes.string.isRequired,
};

const MultiFaceCapture = ({ onComplete, showSwitch = false }) => {
  const { videoRef, stream, error, startCamera, stopCamera, switchCamera, captureImage } =
    useCamera();
  const { currentAngle, capturedImages, handleCapture, skipAngle, retake, nextStep } =
    useMultiCapture(captureImage, stopCamera, onComplete);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const progress = ((currentAngle + 1) / angles.length) * 100;
  const currentAngleData = angles[currentAngle];
  const isCurrentCaptured = !!capturedImages[currentAngleData.id];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Multi-Angle Face Capture</h3>
        <p className="text-medical-gray-600 text-sm mb-4">
          Capture your face from multiple angles for better recognition accuracy
        </p>

        <ProgressBar progress={progress} />
        <CurrentAngleInfo
          index={currentAngle}
          total={angles.length}
          label={currentAngleData.label}
          instruction={currentAngleData.instruction}
        />
      </div>

      <div className="relative bg-medical-gray-100 rounded-lg overflow-hidden aspect-[3/4] sm:aspect-video">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Camera Controls */}
        {showSwitch && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={switchCamera}
              className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all duration-200"
              title="Switch Camera"
            >
              <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}

        <FaceGuideOverlay isCaptured={isCurrentCaptured} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <CapturedAnglesList
        angles={angles}
        capturedImages={capturedImages}
        currentAngle={currentAngle}
      />

      <CaptureControls
        isCaptured={isCurrentCaptured}
        hasStream={!!stream}
        onCapture={handleCapture}
        onSkip={skipAngle}
        onRetake={retake}
        onNext={nextStep}
        isLastStep={currentAngle >= angles.length - 1}
        currentLabel={currentAngleData.label}
      />

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
  showSwitch: PropTypes.bool,
};

export default MultiFaceCapture;
