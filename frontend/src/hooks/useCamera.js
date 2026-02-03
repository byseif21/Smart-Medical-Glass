import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Stops all tracks in a media stream.
 * @param {MediaStream} stream - The media stream to stop.
 */
const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

/**
 * Captures a frame from a video element and returns it as a File.
 * @param {HTMLVideoElement} video - The video element to capture from.
 * @param {string} fileName - The name of the file to create.
 * @returns {Promise<File>} A promise that resolves with the captured image file.
 */
const captureVideoFrame = (video, fileName) => {
  return new Promise((resolve, reject) => {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return reject(new Error('Video stream not ready'));
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to create image blob'));
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
};

/**
 * Custom hook to handle camera operations
 * @returns {Object} Camera controls and state
 */
export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      stopMediaStream(streamRef.current);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 640, height: 480 },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions or try a different device.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const captureImage = useCallback((fileName = 'captured-face.jpg') => {
    const video = videoRef.current;
    if (!video) {
      return Promise.reject(new Error('Video ref is not attached or camera not started'));
    }
    return captureVideoFrame(video, fileName);
  }, []);

  useEffect(() => {
    return () => stopMediaStream(streamRef.current);
  }, []);

  return {
    videoRef,
    stream,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    facingMode,
    captureImage,
  };
};
