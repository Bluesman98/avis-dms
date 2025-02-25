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
    handleRetrieve(record.filePath.replace(/\\/g, "-"));
  }, [record.filePath]);

  const { folderName, subFolderName, range, category, filePath, area, year, protocolNo, buildingBlock, aproovalNo, subCategory } = record || {};
  return (
    <tr>
      {fields.includes('folderName') && <td className="p-4 border-b border-slate-200">{folderName}</td>}
      {fields.includes('subFolderName') && <td className="p-4 border-b border-slate-200">{subFolderName}</td>}
      {fields.includes('range') && <td className="p-4 border-b border-slate-200">{range}</td>}
      {fields.includes('category') && <td className="p-4 border-b border-slate-200">{category}</td>}
      {fields.includes('filePath') && <td className="p-4 border-b border-slate-200">{filePath}</td>}
      {fields.includes('area') && <td className="p-4 border-b border-slate-200">{area}</td>}
      {fields.includes('year') && <td className="p-4 border-b border-slate-200">{year}</td>}
      {fields.includes('protocolNo') && <td className="p-4 border-b border-slate-200">{protocolNo}</td>}
      {fields.includes('buildingBlock') && <td className="p-4 border-b border-slate-200">{buildingBlock}</td>}
      {fields.includes('aproovalNo') && <td className="p-4 border-b border-slate-200">{aproovalNo}</td>}
      {fields.includes('subCategory') && <td className="p-4 border-b border-slate-200">{subCategory}</td>}
      <td className="p-4 border-b border-slate-200">
        <a href={retrievedFileUrl || ''} target="_blank" rel="noopener noreferrer">View File</a>
      </td>
    </tr>
  );
}

export default Record;