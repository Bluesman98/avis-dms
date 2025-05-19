/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Key, useState } from "react";
import classes from './CSS/Dropdown.module.css';

function Dropdown({ handleFilter, categories, selectedCategory, clearData, isLoading }: { handleFilter: any, categories: any, selectedCategory: any, clearData: any, isLoading?: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function handleClick(category: { name: string }) {
    if (!selectedCategory || selectedCategory.name !== category.name) {
      handleFilter(category);
      setIsDropdownOpen(false); // Only close if a new category is selected
      clearData(); // Clear the data in the parent component
    }
    // Do nothing if the category is already selected
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <span className="text-[#d4002a] font-semibold">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className={classes.dropdown}>
      <button
        id="dropdownDefaultButton"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={classes.dropdownButton}
        type="button"
      >
        Categories
        <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
      </button>
      {selectedCategory && <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{selectedCategory.name}</h1>}

      {isDropdownOpen && (
        <div id="dropdown-list" className={classes.dropdownList}>
          <ul>
            {categories.map((category: { name: any }, index: Key | null | undefined) => (
              <li
                key={index}
                className={`${classes.dropdownListItem} ${classes.dropdownListItemLink} ${selectedCategory && selectedCategory.name === category.name ? classes.selected : ''}`}
              >
                <a
                  onClick={() => handleClick(category)}
                  href="#"
                  data-tab-target=""
                  role="tab"
                  style={{
                    pointerEvents: selectedCategory && selectedCategory.name === category.name ? 'none' : 'auto',
                  }}
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dropdown;