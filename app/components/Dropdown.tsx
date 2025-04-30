/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Key, useState } from "react";
import classes from './CSS/Dropdown.module.css'

function Dropdown({ handleFilter, categories, selectedCategory }: { handleFilter: any, categories:any, selectedCategory:any }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    function handleClick(category: { name: string }){
        handleFilter(category);
        setIsDropdownOpen(false); // Close the dropdown after selecting a category
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
          <ul >
            {categories.map((category: { name: any; }, index: Key | null | undefined) => (
              <li className={classes.dropdownListItem} key={index}>
                <a onClick={() => handleClick(category)} href="#" 
                  data-tab-target="" role="tab" aria-selected="true">
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