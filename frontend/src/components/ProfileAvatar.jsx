import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User } from 'lucide-react';
import '../styles/glassmorphism.css';

// Fallback user icon SVG component (defined outside render)
const UserIcon = ({ className }) => (
  <User className={className} />
);

const ProfileAvatar = ({ imageUrl, userName, size = 'md', className = '', clickable = true }) => {
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Size variants mapping
  const sizeClasses = {
    sm: 'w-10 h-10', // 40px
    md: 'w-20 h-20', // 80px
    lg: 'w-28 h-28', // 112px
  };

  // Get the appropriate size class
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Determine if we should show the fallback icon
  const showFallback = !imageUrl || imageError;

  // Handle image load errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when imageUrl changes
  useEffect(() => {
    if (imageError) {
      setImageError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Handle avatar click
  const handleClick = () => {
    if (clickable && !showFallback) {
      setShowModal(true);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  return (
    <>
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center ${className} ${clickable && !showFallback ? 'cursor-pointer hover:ring-2 hover:ring-medical-primary transition-all duration-500' : ''}`}
        style={{ aspectRatio: '1 / 1' }}
        onClick={handleClick}
        role={clickable && !showFallback ? 'button' : undefined}
        tabIndex={clickable && !showFallback ? 0 : undefined}
        onKeyDown={(e) => {
          if (clickable && !showFallback && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {showFallback ? (
          <div className="w-full h-full flex items-center justify-center bg-medical-primary p-2.5">
            <UserIcon className="w-full h-full text-white" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={userName || 'User avatar'}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Modal for enlarged image */}
      {showModal && !showFallback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-medical-primary transition-colors duration-500"
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Enlarged image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src={imageUrl}
                alt={userName || 'User avatar'}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            {/* User name label */}
            {userName && (
              <div className="mt-4 text-center">
                <p className="text-white text-lg font-semibold">{userName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

ProfileAvatar.propTypes = {
  imageUrl: PropTypes.string,
  userName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  clickable: PropTypes.bool,
};

export default ProfileAvatar;
