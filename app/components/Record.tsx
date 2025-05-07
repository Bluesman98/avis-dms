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
  };

  useEffect(() => {
    // Extract the file name from the file path
    const fileName = record.file_path.split('\\').pop(); // Get the last part of the path
    if (fileName) {
      handleRetrieve(`${record.id}_${fileName}`);
      //console.log('File name:', `${record.id_}_${fileName}`);
    } else {
      console.error('File name could not be extracted from file path:', record.file_path);
    }
  }, []);

  return (
    <tr>
      {fields.map((field, index) => (
        <td key={index} className="p-4 border-t border-slate-200">{record[field]}</td>
      ))}
      <td className="p-4 border-t border-slate-200">
        <a href={retrievedFileUrl || ''} target="_blank" rel="noopener noreferrer">View File</a>
      </td>
    </tr>
  );
}

export default Record;