/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Record from "./Record";

function formatFieldName(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Table({ records, fields, fetchDisplayName }: { records: any, fields: string[], fetchDisplayName: (fieldName: string) => Promise<string | null> }) {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchDisplayNames = async () => {
      const names: Record<string, string> = {};
      for (const field of fields) {
        const displayName = await fetchDisplayName(field);
        names[field] = displayName || formatFieldName(field); // Fallback to formatted field name if no display name is found
      }
      setDisplayNames(names);
    };

    fetchDisplayNames();
  }, [fields, fetchDisplayName]);

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

  if (!fields.length) {
    return <div className="text-center">Please Select Category</div>;
  } else if (!records.length && fields.length) {
    return <div className="text-center">No records found</div>;
  }

  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {fields.map((field, index) => (
            <th
              key={index}
              className="py-2 cursor-pointer"
              onClick={() => handleSort(field)}
            >
              {displayNames[field] || formatFieldName(field)}
              {sortField === field && (sortOrder === "asc" ? " ▲" : " ▼")}
            </th>
          ))}
          <th className="py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedRecords.map((record: any) => (
          <Record key={record.id} record={record} fields={fields} />
        ))}
      </tbody>
    </table>
  );
}

export default Table;