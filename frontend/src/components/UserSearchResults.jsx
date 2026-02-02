import PropTypes from 'prop-types';
import { User, UserX, Check } from 'lucide-react';

const EmptyState = () => (
  <div className="p-8 text-center">
    <UserX className="w-12 h-12 mx-auto mb-3 text-medical-gray-300" />
    <p className="text-medical-gray-600">No users found</p>
    <p className="text-sm text-medical-gray-500 mt-1">Try a different search term</p>
  </div>
);

const UserStatusBadge = ({ status, isSelected, onSelect, user }) => {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
        <Check className="w-3.5 h-3.5" />
        Connected
      </span>
    );
  }

  if (status === 'pending_sent') {
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full whitespace-nowrap">
        Request sent
      </span>
    );
  }

  if (status === 'pending_received') {
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full whitespace-nowrap">
        Request received
      </span>
    );
  }

  if (isSelected) {
    return (
      <span className="px-3 py-1 bg-medical-primary text-white text-sm rounded-full whitespace-nowrap">
        Selected
      </span>
    );
  }

  return (
    <button
      onClick={() => onSelect(user)}
      className="btn-medical-primary text-sm px-4 py-2 whitespace-nowrap"
    >
      Select
    </button>
  );
};

UserStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
};

const UserItem = ({ user, selectedUser, onSelect }) => {
  const isSelected = selectedUser?.id === user.id;
  const status = user.connection_status;
  const isUnavailable = status !== 'none';

  return (
    <div
      className={`p-4 border-b border-medical-gray-200 last:border-b-0 transition-colors ${
        isSelected
          ? 'bg-medical-light'
          : isUnavailable
            ? 'bg-medical-gray-50'
            : 'hover:bg-medical-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-medical-primary/10 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-medical-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-medical-dark truncate">{user.name}</p>
            <p className="text-xs text-medical-gray-500 font-mono truncate">
              ID: {user.id.substring(0, 8).toUpperCase()}
            </p>
            {user.email && <p className="text-sm text-medical-gray-400 truncate">{user.email}</p>}
          </div>
        </div>
        <div className="shrink-0">
          <UserStatusBadge
            status={status}
            isSelected={isSelected}
            onSelect={onSelect}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
  selectedUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

const UserSearchResults = ({
  results,
  selectedUser,
  onSelect,
  loading,
  hasSearched,
  searchQuery,
}) => {
  const shouldRender = hasSearched && !loading && searchQuery.length >= 2;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="border border-medical-gray-200 rounded-lg overflow-hidden">
      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {results.map((user) => (
            <UserItem key={user.id} user={user} selectedUser={selectedUser} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

UserSearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  selectedUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  hasSearched: PropTypes.bool.isRequired,
  searchQuery: PropTypes.string.isRequired,
};

export default UserSearchResults;
