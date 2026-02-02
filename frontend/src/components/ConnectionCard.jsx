import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, Globe, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';

const ConnectionBadge = ({ isLinked }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${
      isLinked
        ? 'bg-medical-primary/10 text-medical-primary'
        : 'bg-medical-gray-200 text-medical-gray-700'
    }`}
  >
    {isLinked ? (
      <span className="flex items-center gap-1">
        <LinkIcon className="w-3 h-3" />
        Linked
      </span>
    ) : (
      <span className="flex items-center gap-1">
        <Globe className="w-3 h-3" />
        External
      </span>
    )}
  </span>
);

ConnectionBadge.propTypes = {
  isLinked: PropTypes.bool.isRequired,
};

const ConnectionActions = ({ onEdit, onRemove, connection, isLinked }) => (
  <div className="flex gap-2 sm:ml-4 flex-shrink-0 self-end sm:self-start">
    {onEdit && (
      <button
        onClick={() => onEdit(connection)}
        className="p-2 text-medical-primary hover:bg-medical-light rounded-lg transition-colors"
        title={isLinked ? 'Edit connection' : 'Edit contact'}
      >
        <Edit2 className="w-5 h-5" />
      </button>
    )}

    {onRemove && (
      <button
        onClick={() => onRemove(connection)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove connection"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    )}
  </div>
);

ConnectionActions.propTypes = {
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  connection: PropTypes.object.isRequired,
  isLinked: PropTypes.bool.isRequired,
};

const ConnectionDetails = ({ connection, isLinked }) => (
  <div className="space-y-1">
    {isLinked && connection.connected_user?.email && (
      <p className="text-medical-gray-600 text-sm flex items-center gap-2">
        <Mail className="w-4 h-4" />
        {connection.connected_user.email}
      </p>
    )}

    {isLinked && connection.connected_user?.phone && (
      <p className="text-medical-gray-600 text-sm flex items-center gap-2">
        <Phone className="w-4 h-4" />
        {connection.connected_user.phone}
      </p>
    )}

    {!isLinked && connection.phone && (
      <p className="text-medical-gray-600 text-sm flex items-center gap-2">
        <Phone className="w-4 h-4" />
        {connection.phone}
      </p>
    )}

    {!isLinked && connection.address && (
      <p className="text-medical-gray-600 text-sm flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {connection.address}
      </p>
    )}
  </div>
);

ConnectionDetails.propTypes = {
  connection: PropTypes.object.isRequired,
  isLinked: PropTypes.bool.isRequired,
};

const ConnectionHeader = ({ connection, isLinked }) => (
  <div className="flex flex-wrap items-center gap-2 mb-2">
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
    <ConnectionBadge isLinked={isLinked} />
  </div>
);

ConnectionHeader.propTypes = {
  connection: PropTypes.object.isRequired,
  isLinked: PropTypes.bool.isRequired,
};

const ConnectionCard = ({ connection, type, onEdit, onRemove, showActions = false }) => {
  const isLinked = type === 'linked';

  return (
    <div className="medical-card hover:shadow-medical-hover transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
        <div className="flex-1 w-full">
          <ConnectionHeader connection={connection} isLinked={isLinked} />
          <p className="text-medical-primary text-sm font-medium mb-3">{connection.relationship}</p>
          <ConnectionDetails connection={connection} isLinked={isLinked} />
        </div>

        {showActions && (
          <ConnectionActions
            onEdit={onEdit}
            onRemove={onRemove}
            connection={connection}
            isLinked={isLinked}
          />
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
      phone: PropTypes.string,
    }),
  }).isRequired,
  type: PropTypes.oneOf(['linked', 'external']).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  showActions: PropTypes.bool,
};

export default ConnectionCard;
