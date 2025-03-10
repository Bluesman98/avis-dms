/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";

function Search({
  handleSearch,
  handleFilter,
  selectedCategory,
  selectedFields,
}: {
  handleSearch: any,
  handleFilter: any,
  selectedCategory: any,
  selectedFields: string[]

}) {
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedFilter, setIsAdvancedFilter] = useState(false);


  const handleSearchQueryChange = (field: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [field]: value }));
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
              placeholder={`Search by ${formatFieldName(field)}`}
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

      <button onClick={() => { handleSearch(isAdvancedFilter, searchQueries, searchQuery, selectedCategory, selectedFields) }} className="mt-2 p-2 bg-blue-500 text-white rounded-md">Search</button>
    </div>
  );
}

export default Search;