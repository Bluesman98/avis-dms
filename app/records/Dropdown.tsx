'use client'

import { useState } from "react";

function Dropdown({ handleFilter, categories, selectedCategory }: { handleFilter: any, categories: any[], selectedCategory:any }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    function handleClick(category : any){
        handleFilter(category);
        setIsDropdownOpen(false); // Close the dropdown after selecting a category
    }
  return (
    <div>
              <button
        id="dropdownDefaultButton"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
      >
        Categories
        <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
      </button>
      {selectedCategory && <h1 className="text-2xl font-semibold text-gray-800 dark:text-black">{selectedCategory.name}</h1>}

      {isDropdownOpen && (
        <div id="dropdown" className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700">
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
            {categories.map((category, index) => (
              <li className="z-30 flex-auto text-center" key={index}>
                <a onClick={() => handleClick(category)} href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
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