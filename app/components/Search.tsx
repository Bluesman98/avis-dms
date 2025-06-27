/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'


import { useEffect, useState } from "react";
import { OrbitProgress } from "react-loading-indicators";

function Search({
  handleSearch,
  handleFilter,
  selectedCategory,
  selectedFields,
  fetchDisplayName,
  setSeachStatus
}: {
  handleSearch: any,
  handleFilter: any,
  selectedCategory: any,
  selectedFields: string[],
  fetchDisplayName: (fieldName: string) => Promise<string | null>,
  setSeachStatus: any
}) {
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedFilter, setIsAdvancedFilter] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  const handleSearchQueryChange = (field: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [field]: value }));
  };

  const handleClearSearch = () => {
    setError(null); // Clear errors
    handleFilter(selectedCategory); // Reset the filter to the default state
    setSearchQuery('');
    setSearchQueries({});
    setSeachStatus(false); // Reset search status

  };

  function formatFieldName(fieldName: string): string {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /*useEffect(() => {
    setSearchQuery('');
    setSearchQueries({});
    handleFilter(selectedCategory);
    clearData(); // Clear the data in the parent component
  }, []);*/

  useEffect(() => {
    if (!selectedFields || selectedFields.length === 0) {
      setIsLoading(false);
      return;
    }
    const fetchDisplayNames = async () => {
      setIsLoading(true);
      const names: Record<string, string> = {};
      for (const field of selectedFields) {
        const displayName = await fetchDisplayName(field);
        names[field] = displayName || formatFieldName(field);
      }
      setDisplayNames(names);
      setIsLoading(false);
    };
    fetchDisplayNames();
  }, [selectedFields, fetchDisplayName]);

  if (isLoading) {
    return <div className="flex justify-center items-center"> <OrbitProgress color="#ffffff" size="medium" text="" textColor="white" /></div>;
  }

  const validateSearch = () => {
    if (!isAdvancedFilter) {
      // Simple Search: Ensure the searchQuery is not empty
      if (!searchQuery.trim()) {
        setError('Search field is required for Simple Search.');
        return false;
      }
    } else {
      // Advanced Search: Ensure at least one field in searchQueries is not empty
      const hasAtLeastOneField = Object.values(searchQueries).some(value => value.trim() !== '');
      if (!hasAtLeastOneField) {
        setError('At least one field is required for Advanced Search.');
        return false;
      }
    }
    setError(null); // Clear any previous errors
    return true;
  };

  const handleSearchClick = () => {
    if (validateSearch()) {
      handleSearch(isAdvancedFilter, searchQueries, searchQuery, selectedCategory, selectedFields);
      setSeachStatus(true); // Set search status to true if validation passes
    }
    else setSeachStatus(false); // Set search status to true if validation fails
  };

  return (
    <div className="w-fit p-4">
      <div className="flex justify-start items-center mb-4 gap-2">
        <button
          onClick={() => { setIsAdvancedFilter(false); setError(null) }} // Clear errors when switching to Simple Filter
          className={`p-2 rounded-md font-semibold ${!isAdvancedFilter ? 'bg-white text-[#d4002a] font-semibold' : 'bg-[#d4002a] text-white'}`}
        >
          Simple Filter
        </button>
        <button
          onClick={() => { setIsAdvancedFilter(true); setError(null) }} // Clear errors when switching to Advanced Filter
          className={`p-2 rounded-md font-semibold ${isAdvancedFilter ? 'bg-white text-[#d4002a] font-semibold' : 'bg-[#d4002a] text-white'}`}
        >
          Advanced Filter
        </button>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          handleSearchClick();
        }}
        className="flex flex-col gap-2 mt-4"
      >
        {isAdvancedFilter ? (
          selectedFields.map(field => (
            <div key={field} className="mb-2">
              <input
                type="text"
                placeholder={`Search by ${displayNames[field] || formatFieldName(field)}`}
                value={searchQueries[field] || ''}
                onChange={(e) => handleSearchQueryChange(field, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
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
              className="w-full p-2 border border-gray-300 rounded-md text-black"
            />
          </div>
        )}

        {error && <div className="mb-2 text-white">{error}</div>}

        <div className="flex justify-start items-center gap-2">
          <button
            type="submit"
            className="p-2 bg-[#d4002a] text-white rounded-md font-semibold"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClearSearch}
            className="bg-white text-[#d4002a] font-semibold"
          >
            Clear Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default Search;

