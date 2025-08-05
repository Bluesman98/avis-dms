/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";

function Record({ record, fields, isAdmin }: { record: any, fields: string[], isAdmin?: boolean }) {
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  const handleRetrieve = async (fileName: string) => {
    setIsFetchingUrl(true);
    try {
      const response = await fetch('/api/get-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 10000);
    } catch (error) {
      alert('Failed to fetch file URL.');
      console.error('Error fetching file URL:', error);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch('/api/download-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });
      if (!response.ok) throw new Error('Failed to download file');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(error);
    }
  };

  return (
    <tr>
      {fields.map((field, index) => (
        <td key={index} className="p-4 border-t border-slate-200">{record[field]}</td>
      ))}
      <td className="p-4 border-t border-slate-200">
        <button
          className="ml-2 px-2 py-1 bg-black text-white rounded"
          onClick={async () => {
            const fileName = record.file_path.split('\\').pop();
            if (fileName) {
              await handleRetrieve(`${record.id}_${fileName}`);
            } else {
              alert('File name could not be extracted.');
            }
          }}
          type="button"
          disabled={isFetchingUrl}
        >
          {isFetchingUrl ? 'Loading...' : 'View File'}
        </button>
      </td>
      <td className="p-4 border-t border-slate-200">
        <button
          className="ml-2 px-2 py-1 bg-[#d4002a] text-white rounded"
          onClick={() => {
            const fileName = record.file_path.split('\\').pop();
            if (fileName) {
              handleDownload(`${record.id}_${fileName}`);
            } else {
              alert('File name could not be extracted.');
            }
          }}
          type="button"
        >
          Download File
        </button>
      </td>
      {isAdmin && (
        <td className="p-4 border-t border-slate-200">
          <Link href={`/records/edit/${record.id}`}>
            <button className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">
              Edit
            </button>
          </Link>
        </td>
      )}
    </tr>
  );
}

export default Record;