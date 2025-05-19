/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from "react";
import Table from "./Table";
import Dropdown from "./Dropdown";
import Search from "./Search";
import { bool } from "aws-sdk/clients/signer";
import { useAuth } from "@/lib/AuthContext";
import { OrbitProgress } from "react-loading-indicators";

function Records({ filterCategory, fetchCategories, simpleFilter, advancedFilter,fetchDisplayName }: { filterCategory: any, fetchCategories: any, simpleFilter: any, advancedFilter: any, fetchDisplayName: any }) {
  const [data, setData] = useState<unknown[]>([]);
  const [showData, setShowData] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string, fields: string[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string, fields: string[] } | null>(null);

  const handleFilter = async (category: {
    id: number; name: string, fields: string[]
  }) => {
    const acess = await filterCategory(roles, permissions,category.id);
    if(acess){
      setData([])
      setSelectedFields(category.fields);
      setSelectedCategory(category);
    }
    else throw new Error('You do not have permission to access this category');
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

  const { user, roles, permissions, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to finish
    const fetchData = async () => {
      const temp = await fetchCategories(roles, permissions);
      setCategories(temp);
    };
    fetchData();

    console.log('User: ', user);
    console.log('Roles: ', roles);
    console.log('Permissions: ', permissions);
  }, [roles, permissions]); // Add loading as a dependency

  if (loading) {
    return <div className="flex justify-center items-center"> <OrbitProgress color="#ffffff" size="medium" text="" textColor="white" /></div>;
  }

  const clearData = () => {
    setData([]);
    setSelectedFields([]);
    setSelectedCategory(null);
    setShowData(false);
  };
  const setSearchStatus = (bool : boolean) => {
    setShowData(bool);
  }

  return (
    <div className="">
      <Dropdown handleFilter={handleFilter} categories={categories} selectedCategory={selectedCategory} clearData={clearData}/>
      {selectedCategory && <Search
        selectedCategory={selectedCategory}
        selectedFields={selectedFields}
        handleSearch={handleSearch}
        handleFilter={handleFilter}
        fetchDisplayName={fetchDisplayName}
        setSeachStatus={setSearchStatus}
      />}
      <Table records={data} fields={selectedFields} fetchDisplayName={fetchDisplayName} showData={showData}/>
    </div>
  );
}

export default Records;