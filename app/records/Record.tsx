/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

function Record({ record, fields }: { record: any, fields: string[] }) {
  const [retrievedFileUrl, setRetrievedFileUrl] = useState<string | null>(null);

  const handleRetrieve = async (fileName: string) => {
    const response = await fetch('/api/get-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
    });

    const result = await response.json();
    if (result.fileUrl) {
      setRetrievedFileUrl(result.fileUrl);
    }
    //console.log(result);
  };

  useEffect(() => {
    handleRetrieve(record.file_path.replace(/\\/g, "-"));
  }, [record.file_path]);


  //const { folderName, subFolderName, range, category, filePath, area, year, protocolNo, buildingBlock, aproovalNo, subCategory } = record || {};
  return (
    <tr>
      {fields.map((field, index) => (
        <td key={index} className="p-4 border-b border-slate-200">{record[field]}</td>
      ))}
      <td className="p-4 border-b border-slate-200">
        <a href={retrievedFileUrl || ''} target="_blank" rel="noopener noreferrer">View File</a>
      </td>
    </tr>
  );
}

export default Record;