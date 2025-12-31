import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { searchUsers } from '../services/api';

const UserSearchInput = ({
  onUserSelect,
  selectedUser = null,
  currentUserId = null,
  existingConnections = [],
}) => {
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
        const result = await searchUsers(query);

        if (result.success) {
          // Filter out current user from results
          const filteredUsers = (result.data.users || []).filter(
            (user) => user.id !== currentUserId
          );
          setSearchResults(filteredUsers);
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

  const isUserConnected = (userId) => {
    // existingConnections is an array of user IDs (strings)
    return existingConnections.includes(userId);
  };

  const handleSelectUser = (user) => {
    // Validate user object
    if (!user || !user.id) {
      console.error('Invalid user object:', user);
      setError('Invalid user selection. Please try again.');
      return;
    }

    if (!isUserConnected(user.id)) {
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
            <svg
              className="w-5 h-5 text-medical-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
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
              <svg
                className="w-12 h-12 mx-auto mb-3 text-medical-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-medical-gray-600">No users found</p>
              <p className="text-sm text-medical-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((user) => {
                const isConnected = isUserConnected(user.id);
                const isSelected = selectedUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    className={`p-4 border-b border-medical-gray-200 last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-medical-light'
                        : isConnected
                          ? 'bg-medical-gray-50'
                          : 'hover:bg-medical-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-medical-primary/10 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-medical-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-medical-dark">{user.name}</p>
                          <p className="text-xs text-medical-gray-500 font-mono">
                            ID: {user.id.substring(0, 8).toUpperCase()}
                          </p>
                          {user.email && (
                            <p className="text-sm text-medical-gray-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        {isConnected ? (
                          <span className="px-3 py-1 bg-medical-gray-200 text-medical-gray-600 text-sm rounded-full">
                            Already connected
                          </span>
                        ) : isSelected ? (
                          <span className="px-3 py-1 bg-medical-primary text-white text-sm rounded-full">
                            Selected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectUser(user)}
                            className="btn-medical-primary text-sm px-4 py-2"
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
  existingConnections: PropTypes.array,
};

export default UserSearchInput;
