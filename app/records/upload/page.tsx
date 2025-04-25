'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { fetchCategory, createRecord as uploadCreateRecord } from './upload';
import ProtectedRoute from '@/components/ProtectedRoute';

function Upload() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [metaData, setMetadata] = React.useState<Array<Record<string, string>[]>>([]);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [missingFiles, setMissingFiles] = React.useState<string[]>([]);
  const [excessFiles, setExcessFiles] = React.useState<string[]>([]);
  const [allowUpload, setAllowUpload] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  //const [uploadedRecords, setUploadedRecords] = React.useState<{ id: number; fileName: string }[]>([]);

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

  /*const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = event.target.files;

    // Process the uploaded files
    setFiles(targetFiles);
    console.log('Selected Files: ', targetFiles);
  };*/

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

    const fileNames = Array.from(targetFiles)
      .filter(file => file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel')
      .map(file => file.name);

    const sheetFileNames = new Set<string>();
    const missingFilesList: string[] = [];
    const excessFilesList: string[] = [];
    const duplicateFilesList: string[] = [];
    const seenFilePaths = new Set<string>();

    for (const sheet of metaData) {
      for (const row of sheet) {
        const filePath = row['file_path'];
        const fileName = filePath.split('\\').pop();
        if (fileName) {
          sheetFileNames.add(fileName);

          // Check for duplicates
          if (seenFilePaths.has(filePath)) {
            duplicateFilesList.push(filePath);
          } else {
            seenFilePaths.add(filePath);
          }

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

    if (duplicateFilesList.length > 0) {
      setError(`Duplicate file paths found: ${duplicateFilesList.join(', ')}`);
      console.error('Duplicate file paths: ', duplicateFilesList);
    } else {
      console.log('No duplicate file paths.');
    }

    if (missingFilesList.length === 0 && excessFilesList.length === 0 && duplicateFilesList.length === 0) {
      setFiles(targetFiles);
      setMetadata(metaData);
      setAllowUpload(true);
    }
  };

  const handleUpload = async (uploadedRecords: { id: number; fileName: string }[]) => {
    if (!files || files.length === 0) return;
  
    for (const file of Array.from(files).filter(file => file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel')) {
      const record = uploadedRecords.find((record) => record.fileName === file.name);
      if (!record) {
        console.error(`No record found for file: ${file.name}`);
        continue;
      }
  
      const reader = new FileReader();
      reader.readAsDataURL(file);
  
      reader.onloadend = async () => {
        const base64File = reader.result?.toString().split(',')[1];
  
        // Update the file name to include the record ID
        const newFileName = `${record.id}_${file.name}`;
  
        // Upload the file with the new name
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: base64File, fileName: newFileName }),
        });
  
        const result = await response.json();
        console.log('Upload result:', result);
      };
    }
  };

  /*function isNull(value: string): boolean {
    return value !== null && value !== undefined;
  }*/

  async function categoryCheck(i: number) {
    const sheet = sheetNames[i];
    if (!sheet) return null;
  
    const category = await fetchCategory(sheet);
    console.log('Sheet: ', sheet);
    console.log('Category: ', category);
  
    if (!category || category.length === 0) {
      const errorMessage = `Category for sheet "${sheet}" does not exist in the database.`;
      setError(errorMessage);
      console.error(errorMessage);
      throw new Error(errorMessage); // Throw an error to stop further processing
    }
  
    return category[0];
  }

  async function createData(metaData: Array<Record<string, string>[]>): Promise<{ id: number; fileName: string }[]> {
    console.group('Uploading Data');
  
    const newUploadedRecords: { id: number; fileName: string }[] = [];
  
    for (let i = 0; i < sheetNames.length; i++) {
      try {
        const category = await categoryCheck(i);
        if (category) {
          const categoryFields = new Set(
            Object.keys(category).filter(
              (key) => typeof category[key] === 'boolean' && category[key] === true && key !== 'id' && key !== 'category_name'
            )
          );
  
          console.log('Category fields:', categoryFields);
  
          for (let j = 0; j < metaData[i].length; j++) {
            const row = metaData[i][j];
  
            // Validate that the row fields match the category fields
            const rowFields = Object.keys(row);
            const invalidFields = rowFields.filter((field) => !categoryFields.has(field));
  
            if (invalidFields.length > 0) {
              console.error(`Row contains invalid fields: ${invalidFields.join(', ')}`);
              continue; // Skip this row if it contains invalid fields
            }
  
            // Construct the record data dynamically
            const recordData: Partial<Record<string, string>> = {};
            categoryFields.forEach((field) => {
              if (row[field] !== undefined) {
                recordData[field] = row[field];
              }
            });
  
            // Proceed to create the record and get the record ID
            const filteredRecordData = Object.fromEntries(
              Object.entries(recordData).filter(([, value]) => value !== undefined)
            ) as Record<string, string>;
            const recordId = await uploadCreateRecord(Number(category.id), filteredRecordData);
  
            // Store the record ID and file name
            if (row['file_path']) {
              const filePath = row['file_path'];
              const fileName = filePath.split('\\').pop();
              if (fileName) {
                newUploadedRecords.push({ id: recordId, fileName: fileName });
              } else {
                console.error('File name is undefined for file path:', filePath);
              }
            }
  
            console.log('Created record:', recordData);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error creating data:', error.message);
        } else {
          console.error('Error creating data:', error);
        }
        break; // Stop processing further sheets if an error occurs
      }
    }
  
    console.log('Completed: ', metaData);
    console.groupEnd();
  
    return newUploadedRecords;
  }

  return (
    <ProtectedRoute reqRole={["admin"]}>
      <div className="container">
        <div className="upload">
          <input
            type="file"
            ref={(input) => {
              if (input) input.webkitdirectory = true;
            }}
            multiple
            onChange={handleDirectoryInput}
          />
          {allowUpload && (
            <button
              onClick={async () => {
                const newRecords = await createData(metaData);
                await handleUpload(newRecords);
              }}
            >
              Upload Directory
            </button>
          )}
        </div>
        {error && (
          <div className="error-files">
            <h3>Error:</h3>
            <p>{error}</p>
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

