
import React from 'react';

const SearchHelperText: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-700">
        💡 <strong>Tip:</strong> Enter the 10-character Owner ID provided by your property owner (e.g., "a9x8b7c2qk"). 
        The ID contains only lowercase letters and numbers for easy sharing!
      </p>
    </div>
  );
};

export default SearchHelperText;
