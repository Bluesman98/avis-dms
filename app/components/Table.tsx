/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Record from "./Record";
import { OrbitProgress } from "react-loading-indicators";
import { bool } from "aws-sdk/clients/signer";

function formatFieldName(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Table({ records, fields, fetchDisplayName, showData, isAdmin }: { records: any, fields: string[], fetchDisplayName: (fieldName: string) => Promise<string | null>, showData: bool, isAdmin: bool }) {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(10); // Default to 10 records per page
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true); // <--- Ensure loading state is set immediately
    const fetchDisplayNames = async () => {
      const names: Record<string, string> = {};
      for (const field of fields) {
        const displayName = await fetchDisplayName(field);
        names[field] = displayName || formatFieldName(field);
      }
      setDisplayNames(names);

    };
    fetchDisplayNames();
    setIsLoading(false); // End loading after fetching display names
  }, [fields, fetchDisplayName]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when records change (e.g., after search)
  }, [records]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = records.length > 0 ? Math.ceil(records.length / recordsPerPage) : 1;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRecordsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRecordsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to the first page when changing the number of records per page
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  /*console.log('Records Length:', records.length);
  console.log('Records Per Page:', recordsPerPage);
  console.log('Total Pages:', totalPages);
  console.log('Current Page:', currentPage);*/

  /*if (!fields.length) {
    return <div className="text-center">Please Select Category</div>;
  } else if (!records.length && fields.length) {
    return <div className="text-center">No records found</div>;
  }*/



  if (isLoading) {
    return <div className="flex justify-center items-center"> <OrbitProgress color="#ffffff" size="medium" text="" textColor="white" /></div>;
  }



  else if (records.length && fields.length && !isLoading && showData) {

    return (
      <div>
        <div className="flex justify-between items-center mb-4 ">
          <div>
            <label htmlFor="recordsPerPage" className="mr-2 font-semibold text-white" >Records per page:</label>
            <select
              id="recordsPerPage"
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="px-2 py-1  bg-white text-black"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            <span className="font-semibold text-white">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <table className="min-w-full bg-white rounded-md" >
          <thead className="py-4">
            <tr >
              {fields.map((field, index) => (
                <th
                  key={index}
                  className="pl-4 py-4 text-left cursor-pointer"
                  onClick={() => handleSort(field)}
                >
                  {displayNames[field] || formatFieldName(field)}
                  {sortField === field && (sortOrder === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
              <th className="pl-4 py-4 text-left cursor-pointer">Actions</th>
            </tr>
          </thead>
          <tbody className="rounded-md">
            {currentRecords.map((record: any) => (
              <Record key={record.id} record={record} fields={fields} isAdmin={isAdmin} />
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4 ">
          {/* Button to go to the first page */}
          <button
            onClick={() => handlePreviousPage()}
            disabled={currentPage === 1}
            className="mr-2 p-2 bg-black text-white rounded-md font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          {/* Dynamically render page numbers with ellipses */}
          <div className="flex space-x-2 text-white">
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((pageNumber) => {
                // Show the first page, last page, second page, second-to-last page, and 3 pages before/after the current page
                return (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  pageNumber === 2 ||
                  pageNumber === totalPages - 1 ||
                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                );
              })
              .reduce((acc: (number | string)[], pageNumber, index, array) => {
                // Add ellipses if there is a gap between consecutive pages
                if (index > 0 && pageNumber !== array[index - 1] + 1) {
                  acc.push("...");
                }
                acc.push(pageNumber);
                return acc;
              }, [])
              .map((pageNumber, index) =>
                typeof pageNumber === "number" ? (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageClick(pageNumber)}
                    className={`px-3 py-1 rounded ${currentPage === pageNumber ? "bg-black text-white" : "bg-white text-black"
                      }`}
                  >
                    {pageNumber}
                  </button>
                ) : (
                  <span key={`ellipsis-${index}`} className="px-3 py-1">
                    {pageNumber}
                  </span>
                )
              )}
          </div>

          {/* Button to go to the last page */}
          <button
            onClick={() => handleNextPage()}
            disabled={currentPage === totalPages}
            className="mr-2 py-2 px-4 bg-black text-white rounded-md font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );

  }
  else return <div className="text-center text-white">No data to display</div>;

}

export default Table;