/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from "react";
import Table from "./Table";
import Dropdown from "./Dropdown";
import Search from "./Search";
import { bool } from "aws-sdk/clients/signer";
import { useAuth } from "@/lib/AuthContext";

function Records({ filterCategory, fetchCategories, simpleFilter, advancedFilter,fetchDisplayName }: { filterCategory: any, fetchCategories: any, simpleFilter: any, advancedFilter: any, fetchDisplayName: any }) {
  const [data, setData] = useState<unknown[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string, fields: string[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string, fields: string[] } | null>(null);

  const handleFilter = async (category: {
    id: number; name: string, fields: string[]
  }) => {
    const filteredData = await filterCategory(roles, permissions,category.id);
    setData(filteredData);
    setSelectedFields(category.fields);
    setSelectedCategory(category);
  };

  const handleSearch = async (isAdvancedFilter: bool, searchQueries: Record<string, string>, searchQuery: string, selectedCategory: {
    id: any; name: string, fields: string[]
  }, selectedFields: string[]) => {
    if (selectedCategory) {
      if (isAdvancedFilter) {
        const filteredData = await advancedFilter(searchQueries, selectedCategory.id);
        setData(filteredData);
      } else {
        const filteredData = await simpleFilter(searchQuery, selectedCategory.id, selectedFields);
        setData(filteredData);
      }
    }
  };

  const { user, roles, permissions } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const temp = await fetchCategories(roles, permissions);
     /* if (roles && roles.includes("admin")) setCategories(temp);
      else {
      const filteredCategories = temp.filter((category: { id: number }) => {
        return permissions && permissions[category.id.toString()] && permissions[category.id.toString()].includes("read");
      });
      setCategories(filteredCategories);}*/
      setCategories(temp);
    };
    fetchData();

    console.log('User: ', user);
    console.log('Roles: ', roles);
    console.log('Permissions: ', permissions);
  }, []);

  return (
    <div className="">
      <Dropdown handleFilter={handleFilter} categories={categories} selectedCategory={selectedCategory} />
      {selectedCategory && <Search
        selectedCategory={selectedCategory}
        selectedFields={selectedFields}
        handleSearch={handleSearch}
        handleFilter={handleFilter}
        fetchDisplayName={fetchDisplayName}
      />}
      <Table records={data} fields={selectedFields} fetchDisplayName={fetchDisplayName}/>
    </div>
  );
}

export default Records;