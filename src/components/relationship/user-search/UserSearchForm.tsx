
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import ScanQrIcon from '@/components/icons/ScanQrIcon';


interface UserSearchFormProps {
  searchId: string;
  setSearchId: (value: string) => void;
  isSearching: boolean;
  requestSent: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onScanClick?: () => void;
}

const UserSearchForm: React.FC<UserSearchFormProps> = ({
  searchId,
  setSearchId,
  isSearching,
  requestSent,
  onSubmit,
  onClear,
  onScanClick
}) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Enter Owner ID (e.g., a9x8b7c2qk)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="w-full pr-20 h-12 text-base border-2 border-gray-200 focus:border-blue-500 font-mono tracking-wider"
          disabled={requestSent}
          maxLength={10}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchId && !requestSent && (
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={onClear}
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {onScanClick && !requestSent && (
            <button
              type="button"
              onClick={onScanClick}
              className="p-2 rounded-lg text-primary hover:bg-primary/10 transition"
              aria-label="Scan Owner QR"
              title="Scan Owner QR"
            >
              <ScanQrIcon size={20} />
            </button>
          )}
        </div>
      </div>
      <Button
        type="submit"
        disabled={isSearching || !searchId.trim() || requestSent}
        className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
      >
        {isSearching ? (
          <>
            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search
          </>
        )}
      </Button>
    </form>
  );
};

export default UserSearchForm;

