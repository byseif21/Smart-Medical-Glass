import PropTypes from 'prop-types';
import '../styles/glassmorphism.css';

const PersonCard = ({ user, confidence, imageUrl }) => {
  return (
    <div className="glass-card hover-lift p-6 max-w-md mx-auto">
      {/* Header with confidence score */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-glow-pink">Person Recognized</h3>
        {confidence !== undefined && (
          <div className="glass-card-dark px-3 py-1 rounded-full">
            <span className="text-sm font-semibold neon-gradient-text">
              {(confidence * 100).toFixed(1)}% Match
            </span>
          </div>
        )}
      </div>

      {/* User Image */}
      {(imageUrl || user?.image_url) && (
        <div className="mb-4 flex justify-center">
          <div className="glow-border-blue rounded-lg overflow-hidden w-32 h-32">
            <img
              src={imageUrl || user.image_url}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* User Information */}
      <div className="space-y-3">
        {/* Name */}
        {user?.name && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Name</div>
            <div className="text-lg font-semibold text-white">{user.name}</div>
          </div>
        )}

        {/* Job/Role */}
        {user?.job && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Job / Role</div>
            <div className="text-lg font-semibold text-glow-blue">{user.job}</div>
          </div>
        )}

        {/* Email */}
        {user?.email && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
            <div className="text-sm text-white break-all">{user.email}</div>
          </div>
        )}

        {/* Phone */}
        {user?.phone && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</div>
            <div className="text-sm text-white">{user.phone}</div>
          </div>
        )}

        {/* Additional Info */}
        {user?.additional_info && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Additional Information
            </div>
            <div className="text-sm text-white">{user.additional_info}</div>
          </div>
        )}

        {/* Registration Date */}
        {user?.created_at && (
          <div className="glass-card-dark p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Registered</div>
            <div className="text-sm text-white">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        )}
      </div>

      {/* Decorative Glow Effect */}
      <div className="mt-4 h-1 rounded-full neon-gradient-bg pulse-glow"></div>
    </div>
  );
};

PersonCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    job: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    additional_info: PropTypes.string,
    image_url: PropTypes.string,
    created_at: PropTypes.string,
  }),
  confidence: PropTypes.number,
  imageUrl: PropTypes.string,
};

export default PersonCard;
