/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from "react";
import Table from "./Table";
import Dropdown from "./Dropdown";
import Search from "./Search";
import { bool } from "aws-sdk/clients/signer";

function Records({filterCategory, categories, simpleFilter, advancedFilter }: {filterCategory: any, categories: any, simpleFilter: any, advancedFilter: any}) {
  const [data, setData] = useState<unknown[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<{ name: string, fields: string[] } | null>(null);



  const handleFilter = async (category: { name: string, fields: string[] }) => {
    const filteredData = await filterCategory(category.name);
    setData(filteredData);
    setSelectedFields(category.fields);
    setSelectedCategory(category);
   
  };


  const handleSearch = async (isAdvancedFilter : bool, searchQueries: Record<string, string>, searchQuery: string, selectedCategory: { name: string, fields: string[] }, selectedFields: string[]) => {
    if (selectedCategory) {
      if (isAdvancedFilter) {
        const filteredData = await advancedFilter(searchQueries, selectedCategory);
        setData(filteredData);
      } else {
        const filteredData = await simpleFilter(searchQuery, selectedCategory, selectedFields);
        setData(filteredData);
      }
    }
  };
 

  //useEffect(() => { setData(records); }, [records]);

  return (
    <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-lg bg-clip-border">

      <Dropdown handleFilter={handleFilter} categories={categories} selectedCategory={selectedCategory} />
{selectedCategory && <Search
        selectedCategory={selectedCategory}
        selectedFields={selectedFields}
        handleSearch={handleSearch}
        />}

      <Table records={data} fields={selectedFields}  />
    </div>
  );
}

export default Records;