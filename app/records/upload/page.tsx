'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { fetchCategory, createRecord as uploadCreateRecord } from './upload';
import ProtectedRoute from '../../components/ProtectedRoute';
import classes from '../../components/CSS/Upload.module.css'

function Upload() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [metaData, setMetadata] = React.useState<Array<Record<string, string>[]>>([]);
  //const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [missingFiles, setMissingFiles] = React.useState<string[]>([]);
  const [excessFiles, setExcessFiles] = React.useState<string[]>([]);
  const [allowUpload, setAllowUpload] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [duplicateFiles, setDuplicateFiles] = React.useState<string[]>([]);
  //const [uploadedRecords, setUploadedRecords] = React.useState<{ id: number; fileName: string }[]>([]);

  const handleMetadataInput = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    console.log('Selected Workbook: ', workbook);
    //setSheetNames(workbook.SheetNames);
    const temp = [];
    const categories = new Set<string>(); // To store unique category names

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]]) as Record<string, string>[];
      temp.push(sheetData);

      // Extract category names from the column "category_name"
      sheetData.forEach((row) => {
        if (row['category_name']) {
          categories.add(row['category_name']);
        }
      });
    }

    console.log('Extracted Categories: ', Array.from(categories));
    setMetadata(temp);
    return { metadata: temp, categories: Array.from(categories) };
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
      const result = await handleMetadataInput(excelFile);
      metaData = result.metadata;
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

        // Check if filePath is undefined or empty
        if (!filePath || filePath.trim() === '') {
          const errorMessage = `Row in sheet has an empty or undefined file_path.`;
          setError((prevError) => `${prevError}\n${errorMessage}`);
          console.error(errorMessage);
          continue; // Skip this row
        }

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
      setDuplicateFiles(duplicateFilesList); // Store duplicate files in a separate state
      console.error('Duplicate file paths: ', duplicateFilesList);
    } else {
      setDuplicateFiles([]);
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
        setError(`No record found for file: ${file.name}`);
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

  /*async function categoryCheck(i: number) {
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
  }*/

  async function createData(metaData: Array<Record<string, string>[]>): Promise<{ id: number; fileName: string }[]> {
    console.group('Uploading Data');
  
    const newUploadedRecords: { id: number; fileName: string }[] = [];
    const errors: string[] = []; // Collect errors
  
    for (const sheet of metaData) {
      for (const row of sheet) {
        try {
          const categoryName = row['category_name']; // Read category name from the column
          if (!categoryName) {
            const errorMessage = `Row is missing a category_name.`;
            errors.push(errorMessage);
            console.error(errorMessage);
            continue; // Skip this row
          }
  
          const category = await fetchCategory(categoryName);
          if (!category || category.length === 0) {
            const errorMessage = `Category "${categoryName}" does not exist in the database.`;
            errors.push(errorMessage);
            console.error(errorMessage);
            continue; // Skip this row
          }
  
          const categoryFields = new Set(
            Object.keys(category[0]).filter(
              (key) =>
                typeof category[0][key] === 'boolean' &&
                category[0][key] === true &&
                key !== 'id' &&
                key !== 'category_name'
            )
          );
  
          console.log('Category fields:', categoryFields);
  
          // Validate that the row fields include all the category fields
          const rowFields = Object.keys(row);
          const missingFields = Array.from(categoryFields).filter((field) => !rowFields.includes(field));
          
          if (missingFields.length > 0) {
            console.error(`Row is missing required fields: ${missingFields.join(', ')}`);
            continue; // Skip this row if it is missing required fields
          }
  
          // Validate that the row fields match the category fields
          /*const invalidFields = rowFields.filter((field) => !categoryFields.has(field));
  
          if (invalidFields.length > 0) {
            console.error(`Row contains invalid fields: ${invalidFields.join(', ')}`);
            continue; // Skip this row if it contains invalid fields
          }*/
  
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
          const recordId = await uploadCreateRecord(Number(category[0].id), filteredRecordData);
  
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
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error creating data:', error.message);
            errors.push(error.message);
          } else {
            console.error('Error creating data:', error);
          }
        }
      }
    }
  
    // Append errors to the error state
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
  
    console.log('Completed: ', metaData);
    console.groupEnd();
  
    return newUploadedRecords;
  }

  return (
    <ProtectedRoute reqRole={["admin"]}>
      <div className={classes.container}>
        <div className={classes.upload}>
          <input className={classes.input}
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
        <div className={classes.errorContainer}>
          {error && (
            <div className="error-files">
              <h3>Error Files:</h3>
              <ul>
                {error.split('\n').map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {duplicateFiles.length > 0 && (
            <div className="duplicate-files">
              <h3>Duplicate Files:</h3>
              <ul>
                {duplicateFiles.map((file, index) => (
                  <li key={index}>{file}</li>
                ))}
              </ul>
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
      </div>
    </ProtectedRoute>
  );
}

export default Upload;

