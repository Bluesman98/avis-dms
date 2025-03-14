/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { fetchCategory, createCategory, createRecord } from './upload';
import ProtectedRoute from '@/components/ProtectedRoute';

function Upload() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [metaData, setMetadata] = React.useState<Array<Record<string, string>[]>>([]);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [missingFiles, setMissingFiles] = React.useState<string[]>([]);
  const [excessFiles, setExcessFiles] = React.useState<string[]>([]);
  const [allowUpload, setAllowUpload] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const handleMetadataInput = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    console.log('Selected Workbook: ', workbook);
    setSheetNames(workbook.SheetNames);
    const temp = [];

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      temp.push(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]]) as Record<string, string>[]);
    }
    console.log('temp: ', temp);
    //setMetadata(temp);
    return temp
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = event.target.files;

    // Process the uploaded files
    setFiles(targetFiles);
    console.log('Selected Files: ', targetFiles);
  };

   function checkFileTypes(targetFiles: FileList): boolean {
    let excelCounter = 0;
    //let excelFile = null;

    for (const file of Array.from(targetFiles)) {
      const fileType = file.type;
     
      if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileType === 'application/vnd.ms-excel') {
        if (excelCounter) {
          break;
        }
        excelCounter++;
        //excelFile = file;
      }
    }

    if (excelCounter == 1) {
      //setFiles(targetFiles);
      //await handleMetadataInput(excelFile);
      console.log('Selected Files: ', targetFiles);
      return true;
    } else {
      console.log('Invalid file selection. Please select exaclty one Excel workbook');
      setError('Invalid file selection. Please select exaclty one Excel workbook')
      return false;
    }
  }

  const handleDirectoryInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = event.target.files;
    if (!targetFiles) return;

    if (!checkFileTypes(targetFiles)) return;
  
    const excelFile = Array.from(targetFiles).find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'
    );

    let metaData: Record<string, string>[][] = [];
    if (excelFile) {
      metaData = await handleMetadataInput(excelFile);
    }

    const fileNames = Array.from(targetFiles).filter(file => file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel')
    .map(file => file.name);
    const sheetFileNames = new Set<string>();
    const missingFilesList: string[] = [];
    const excessFilesList: string[] = [];

    for (const sheet of metaData) {
      for (const row of sheet) {
        const filePath = row['Filepath'];
        const fileName = filePath.split('\\').pop();
        if (fileName) {
          sheetFileNames.add(fileName);
          if (!fileNames.includes(fileName)) {
            missingFilesList.push(fileName);
          }
        }
      }
    }

    for (const fileName of fileNames) {
      if (!sheetFileNames.has(fileName)) {
       excessFilesList.push(fileName);
      }
    }

    if (missingFilesList.length > 0) {
      setMissingFiles(missingFilesList);
      console.error('Missing files: ', missingFilesList);
    } else {
      setMissingFiles([]);
      console.log('All files exist.');
    }

    if (excessFilesList.length > 0) {
      setExcessFiles(excessFilesList);
      console.error('Excess files: ', excessFilesList);
    } else {
      setExcessFiles([]);
      console.log('No excess files.');
    }

    if(missingFilesList.length === 0 && excessFilesList.length === 0) {
      setFiles(targetFiles);
      setMetadata(metaData);
      setAllowUpload(true);
    }

    // Proceed with further processing if needed
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

  function isNull(value: string): boolean {
    return value !== null && value !== undefined;
  }

  async function categoryCheck(i: number) {
    // Check if the category exists
    const sheet = sheetNames[i];
    const category = await fetchCategory(sheet);
    console.log('Sheet: ', sheet);
    console.log('Category: ', category);

    // If the category does not exist, create it
    if (category.length === 0 && metaData[i].length > 0) {
      await createCategory(
        sheet,
        isNull(metaData[i][0]['ΦΑΚΕΛΟΣ']),
        isNull(metaData[i][0]['ΥΠΟΦΑΚΕΛΟΣ']),
        isNull(metaData[i][0]['ΕΥΡΟΣ']),
        isNull(metaData[i][0]['Ονομασία Αρχείου']),
        isNull(metaData[i][0]['Filepath']),
        isNull(metaData[i][0]['ΠΕΡΙΟΧΗ']),
        isNull(metaData[i][0]['ΕΤΟΣ']),
        isNull(metaData[i][0]['ΑΡ. ΠΡΩΤΟΚΟΛΟΥ']),
        isNull(metaData[i][0]['Ο.Τ.']),
        isNull(metaData[i][0]['ΑΡ. ΕΓΚΡΙΣΗΣ']),
        isNull(metaData[i][0]['Κατηγορία'])
      );
    }

    return category[0];
  }

  async function createData(metaData: Array<Record<string, string>[]>): Promise<void> {
    console.group('Uploading Data');

    for (let i = 0; i < sheetNames.length; i++) {
      const category = await categoryCheck(i);
      if (category) {
        for (let j = 0; j < metaData[i].length; j++) {
          const row = metaData[i][j];
          await createRecord(
            Number(category.id),
            row['ΦΑΚΕΛΟΣ'],
            row['ΥΠΟΦΑΚΕΛΟΣ'],
            row['ΕΥΡΟΣ'],
            row['Ονομασία Αρχείου'],
            row['Filepath'],
            row['ΠΕΡΙΟΧΗ'],
            row['ΕΤΟΣ'],
            row['ΑΡ. ΠΡΩΤΟΚΟΛΟΥ'],
            row['Ο.Τ.'],
            row['ΑΡ. ΕΓΚΡΙΣΗΣ'],
            row['Κατηγορία']
          );

          console.log(row);
        }
      }
    }
    console.log('Completed: ', metaData);
  }

  return (
    <ProtectedRoute reqRole = {["admin"]}>
      <div className="container">
        <div className="upload">
          {false && <input type="file" ref={(input) => { if (input) input.webkitdirectory = true; }} multiple onChange={handleFileInput} />}
          {false && <button onClick={handleUpload}>Upload Files</button>}
        </div>
        <div className="upload">
          {false && <input type="file" onChange={(e) => { if (e.target.files) handleMetadataInput(e.target.files[0]); }} />}
          {false && <button onClick={() => createData(metaData)}>Upload Metadata</button>}
        </div>
        {true && <input type="file" ref={(input) => { if (input) input.webkitdirectory = true; }} multiple onChange={handleDirectoryInput} />}
        {allowUpload && <button onClick={() => { createData(metaData); handleUpload(); }}>Upload Directory</button>}
        {error && (
          <div className="error-files">
            <h3>{error}</h3>
          </div>
        )}
        {missingFiles.length > 0 && (
          <div className="missing-files">
            <h3>Missing Files:</h3>
            <ul>
              {missingFiles.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          </div>
        )}
              {excessFiles.length > 0 && (
          <div className="excess-files">
            <h3>Excess Files:</h3>
            <ul>
              {excessFiles.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default Upload;