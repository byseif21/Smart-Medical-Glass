import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Search, User, UserX, Check } from 'lucide-react';
import { searchUsers } from '../services/api';

const UserSearchInput = ({ onUserSelect, selectedUser = null, currentUserId = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(
    async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError('');
      setHasSearched(true);

      try {
        const result = await searchUsers(query, currentUserId);

        if (result.success) {
          setSearchResults(result.data.users || []);
        } else {
          setError(result.error || 'Search failed. Please try again.');
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Network error. Please check your connection and try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectUser = (user) => {
    // Validate user object
    if (!user || !user.id) {
      console.error('Invalid user object:', user);
      setError('Invalid user selection. Please try again.');
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
      {hasSearched && !loading && searchQuery.length >= 2 && (
        <div className="border border-medical-gray-200 rounded-lg overflow-hidden">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <UserX className="w-12 h-12 mx-auto mb-3 text-medical-gray-300" />
              <p className="text-medical-gray-600">No users found</p>
              <p className="text-sm text-medical-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const status = user.connection_status;
                const isUnavailable = status !== 'none';

                return (
                  <div
                    key={user.id}
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
                          {user.email && (
                            <p className="text-sm text-medical-gray-400 truncate">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {status === 'connected' ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                            <Check className="w-3.5 h-3.5" />
                            Connected
                          </span>
                        ) : status === 'pending_sent' ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full whitespace-nowrap">
                            Request sent
                          </span>
                        ) : status === 'pending_received' ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full whitespace-nowrap">
                            Request received
                          </span>
                        ) : isSelected ? (
                          <span className="px-3 py-1 bg-medical-primary text-white text-sm rounded-full whitespace-nowrap">
                            Selected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectUser(user)}
                            className="btn-medical-primary text-sm px-4 py-2 whitespace-nowrap"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

UserSearchInput.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  currentUserId: PropTypes.string,
};

export default UserSearchInput;
