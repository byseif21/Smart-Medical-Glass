import PropTypes from 'prop-types';
import { Search } from 'lucide-react';
import { useUserSearch } from '../hooks/useUserSearch';
import UserSearchResults from './UserSearchResults';

const UserSearchInput = ({ onUserSelect, selectedUser = null, currentUserId = null }) => {
  const { searchQuery, setSearchQuery, searchResults, loading, error, hasSearched } =
    useUserSearch(currentUserId);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectUser = (user) => {
    // Validate user object
    if (!user || !user.id) {
      console.error('Invalid user object:', user);
      return;
    }

    if (user.connection_status === 'none') {
      onUserSelect(user);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name or ID..."
          className="input-medical pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-medical-primary"></div>
          ) : (
            <Search className="w-5 h-5 text-medical-gray-400" />
          )}
        </div>
      </div>

      {/* Search hint */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-sm text-medical-gray-500">Type at least 2 characters to search</p>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Search Results */}
      <UserSearchResults
        results={searchResults}
        selectedUser={selectedUser}
        onSelect={handleSelectUser}
        loading={loading}
        hasSearched={hasSearched}
        searchQuery={searchQuery}
      />
    </div>
  );
};

UserSearchInput.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  currentUserId: PropTypes.string,
};

export default UserSearchInput;
