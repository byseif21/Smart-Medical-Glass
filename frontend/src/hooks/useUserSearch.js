import { useState, useCallback, useEffect } from 'react';
import { searchUsers } from '../services/api';

export const useUserSearch = (currentUserId) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

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
          setError(result.error || 'Unable to search users. Please try again.');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    hasSearched,
  };
};
