import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ConnectionCard = ({ connection, type, onEdit, onRemove, showActions }) => {
  const isLinked = type === 'linked';

  return (
    <div className="medical-card hover:shadow-medical-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header with name and type badge */}
          <div className="flex items-center gap-2 mb-2">
            {isLinked ? (
              <Link
                to={`/profile/${connection.connected_user?.id}`}
                className="font-semibold text-medical-dark text-lg hover:text-medical-primary transition-colors"
              >
                {connection.connected_user?.name}
              </Link>
            ) : (
              <h3 className="font-semibold text-medical-dark text-lg">{connection.name}</h3>
            )}

            {/* Type badge */}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                isLinked
                  ? 'bg-medical-primary/10 text-medical-primary'
                  : 'bg-medical-gray-200 text-medical-gray-700'
              }`}
            >
              {isLinked ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Linked
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  External
                </span>
              )}
            </span>
          </div>

          {/* Relationship */}
          <p className="text-medical-primary text-sm font-medium mb-3">{connection.relationship}</p>

          {/* Contact details */}
          <div className="space-y-1">
            {/* Email for linked users */}
            {isLinked && connection.connected_user?.email && (
              <p className="text-medical-gray-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {connection.connected_user.email}
              </p>
            )}

            {/* Phone for external contacts */}
            {!isLinked && connection.phone && (
              <p className="text-medical-gray-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {connection.phone}
              </p>
            )}

            {/* Address for external contacts */}
            {!isLinked && connection.address && (
              <p className="text-medical-gray-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {connection.address}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(connection)}
                className="p-2 text-medical-primary hover:bg-medical-light rounded-lg transition-colors"
                title={isLinked ? 'Edit connection' : 'Edit contact'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}

            {/* Remove button - for all connections */}
            {onRemove && (
              <button
                onClick={() => onRemove(connection)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove connection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ConnectionCard.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    relationship: PropTypes.string.isRequired,
    phone: PropTypes.string,
    address: PropTypes.string,
    connected_user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
    }),
  }).isRequired,
  type: PropTypes.oneOf(['linked', 'external']).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  showActions: PropTypes.bool,
};

ConnectionCard.defaultProps = {
  showActions: false,
};

export default ConnectionCard;
