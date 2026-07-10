
import React, { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import UserSearchForm from './user-search/UserSearchForm';
import SearchHelperText from './user-search/SearchHelperText';
import UserSearchResults from './user-search/UserSearchResults';
import SearchErrorMessage from './user-search/SearchErrorMessage';
import QRScannerModal from './QRScannerModal';

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
    searchByOwnerId,
    handleConnect,
    clearSearch,
    searchAnother
  } = useUserSearch(currentUserId);

  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <UserSearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        isSearching={isSearching}
        requestSent={requestSent}
        onSubmit={handleSearch}
        onClear={clearSearch}
        onScanClick={() => setScannerOpen(true)}
      />

      <SearchHelperText />

      {requestError && !foundUser && (
        <SearchErrorMessage error={requestError} />
      )}

      {foundUser && (
        <UserSearchResults
          foundUser={foundUser}
          requestSent={requestSent}
          requestError={requestError}
          onConnect={handleConnect}
          onSearchAnother={searchAnother}
        />
      )}

      <QRScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(id) => {
          searchByOwnerId(id);
        }}
      />
    </div>
  );
};

export default UserSearch;
