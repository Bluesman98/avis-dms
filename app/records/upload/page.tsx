'use client' ;

import React from 'react';
import * as XLSX from 'xlsx';
import { createRecord } from './upload';

function Upload() {

  const [files, setFiles] = React.useState<FileList | null>(null);
  const [metaData, setMetadata] = React.useState<Array<Record<string, string>[]>>([]);

  const handleMetadataInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = event.target.files;
    // Process the uploaded files
    console.log('Selected Files: ', targetFiles)
    event.stopPropagation(); event.preventDefault();
    if (!targetFiles) return;
    const f = targetFiles[0];
    /* f is a File */
    const data = await f.arrayBuffer();
    /* data is an ArrayBuffer */
    const workbook = XLSX.read(data);

    console.log('Selected Workbook: ', workbook)
    const temp = []

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      temp.push(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]]) as Record<string, string>[])
    }

    console.log("temp: ",temp)
    setMetadata(temp)
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {

    const targetFiles = event.target.files;

    // Process the uploaded files
    setFiles(targetFiles)
    console.log('Selected Files: ', targetFiles)

  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => { 
        const base64File = reader.result?.toString().split(',')[1];

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: base64File, fileName: file.name }),
        });

        const result = await response.json();
        console.log(result);
      };
    }
  };


  async function createData(metaData: Array<Record<string, string>[]>): Promise<void> {
    console.group('Uploading Data');
    for (const sheet of metaData) {
      for (const row of sheet){     //createTodo(row.barcode, row.vendorName, row.invoiceDate, row.entryDate, row.taxCode)
       //if( row['Ονομασία Αρχείου'] === 'Ν.3843-2010'){
        await createRecord(row['ΦΑΚΕΛΟΣ'], row['ΥΠΟΦΑΚΕΛΟΣ'], row['ΕΥΡΟΣ'], row['Ονομασία Αρχείου'], row['Filepath'], row['ΠΕΡΙΟΧΗ'], row['ΕΤΟΣ'], row['ΑΡ. ΠΡΩΤΟΚΟΛΟΥ'], row['Ο.Τ.'], row['ΑΡ. ΕΓΚΡΙΣΗΣ'], row['Κατηγορία'])
        //console.log(row['ΦΑΚΕΛΟΣ'], row['ΥΠΟΦΑΚΕΛΟΣ'], row['ΕΥΡΟΣ'], row['Ονομασία Αρχείου'], row['Filepath'], row['ΠΕΡΙΟΧΗ'], row['ΕΤΟΣ'], row['ΑΡ. ΠΡΩΤΟΚΟΛΟΥ'], row['Ο.Τ.'], row['ΑΡ. ΕΓΚΡΙΣΗΣ'])
        // }
    }
 
    }
    console.log('Completed: ', metaData)
}

  return (
    <div className="container">
      <div className='upload'>
        {true && <input type="file" ref={input => { if (input) input.webkitdirectory = true; }} multiple onChange={handleFileInput} />}
        {true && <button onClick={handleUpload}
        >Upload Files</button>}
      </div>
      <div className='upload'>
        {true && <input type="file" onChange={handleMetadataInput} />}
        {true && <button
          onClick={() =>
            createData(metaData)
          }
        >Upload Metadata</button>}
      </div>
      {false && <button
      >List Storage</button>}
    </div>
  );
}

export default Upload;