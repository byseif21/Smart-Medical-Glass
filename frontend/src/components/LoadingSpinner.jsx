import '../styles/glassmorphism.css';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-6',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      {/* Animated Spinner */}
      <div className="relative">
        <div
          className={`${spinnerSize} rounded-full border-white/10 border-t-pink-500 border-r-blue-400 animate-spin pulse-glow`}
          style={{
            boxShadow: '0 0 20px rgba(255, 0, 110, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
          }}
        ></div>

        {/* Inner glow effect */}
        <div
          className={`absolute inset-0 ${spinnerSize} rounded-full`}
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 110, 0.1) 0%, transparent 70%)',
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        ></div>
      </div>

      {/* Loading Message */}
      {message && (
        <div className="text-center">
          <p className="text-white font-medium animate-pulse">{message}</p>
          <div className="flex justify-center space-x-1 mt-2">
            <span
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
