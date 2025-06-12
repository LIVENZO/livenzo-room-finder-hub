
import React from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import UserSearchForm from './user-search/UserSearchForm';
import SearchHelperText from './user-search/SearchHelperText';
import UserSearchResults from './user-search/UserSearchResults';
import SearchErrorMessage from './user-search/SearchErrorMessage';

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId }) => {
  const {
    searchId,
    setSearchId,
    isSearching,
    foundUser,
    requestSent,
    requestError,
    handleSearch,
    handleConnect,
    clearSearch,
    searchAnother
  } = useUserSearch(currentUserId);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <UserSearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        isSearching={isSearching}
        requestSent={requestSent}
        onSubmit={handleSearch}
        onClear={clearSearch}
      />

      {/* Helper Text */}
      <SearchHelperText />

      {/* Error Message */}
      {requestError && !foundUser && (
        <SearchErrorMessage error={requestError} />
      )}

      {/* Search Results */}
      {foundUser && (
        <UserSearchResults
          foundUser={foundUser}
          requestSent={requestSent}
          requestError={requestError}
          onConnect={handleConnect}
          onSearchAnother={searchAnother}
        />
      )}
    </div>
  );
};

export default UserSearch;
