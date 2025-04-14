/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";

function Search({
  handleSearch,
  handleFilter,
  selectedCategory,
  selectedFields,
  fetchDisplayName
}: {
  handleSearch: any,
  handleFilter: any,
  selectedCategory: any,
  selectedFields: string[],
  fetchDisplayName: (fieldName: string) => Promise<string | null>
}) {
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedFilter, setIsAdvancedFilter] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});

  const handleSearchQueryChange = (field: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [field]: value }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchQueries({});
    handleFilter(selectedCategory); // Reset the filter to the default state
  };

  function formatFieldName(fieldName: string): string {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  useEffect(() => {
    setSearchQuery('');
    setSearchQueries({});
    handleFilter(selectedCategory);
  }, [selectedCategory, isAdvancedFilter]);

  useEffect(() => {
    const fetchDisplayNames = async () => {
      const names: Record<string, string> = {};
      for (const field of selectedFields) {
        const displayName = await fetchDisplayName(field);
        names[field] = displayName || formatFieldName(field); // Fallback to formatted field name if no display name is found
      }
      setDisplayNames(names);
    };

    fetchDisplayNames();
  }, [selectedFields, fetchDisplayName]);

  return (
    <div className="w-full p-4">
      <div className="flex justify-start items-center mb-4">
        <button
          onClick={() => setIsAdvancedFilter(false)}
          className={`p-2 rounded-md ${!isAdvancedFilter ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Simple Filter
        </button>
        <button
          onClick={() => setIsAdvancedFilter(true)}
          className={`p-2 rounded-md ${isAdvancedFilter ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Advanced Filter
        </button>
      </div>

      {isAdvancedFilter ? (
        selectedFields.map(field => (
          <div key={field} className="mb-2">
            <input
              type="text"
              placeholder={`Search by ${displayNames[field] || formatFieldName(field)}`}
              value={searchQueries[field] || ''}
              onChange={(e) => handleSearchQueryChange(field, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        ))
      ) : (
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      <div className="flex justify-start items-center mt-4">
        <button
          onClick={() => handleSearch(isAdvancedFilter, searchQueries, searchQuery, selectedCategory, selectedFields)}
          className="mr-2 p-2 bg-blue-500 text-white rounded-md"
        >
          Search
        </button>
        <button
          onClick={handleClearSearch}
          className="p-2 bg-gray-200 text-gray-700 rounded-md"
        >
          Clear Search
        </button>
      </div>
    </div>
  );
}

export default Search;