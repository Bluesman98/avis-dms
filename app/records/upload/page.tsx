'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import ProtectedRoute from '../../components/ProtectedRoute';
import classes from '../../components/CSS/Upload.module.css'
import { getAuth } from "firebase/auth";
import { OrbitProgress } from 'react-loading-indicators';

function Upload() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [metaData, setMetadata] = React.useState<unknown[]>([]);
  const [validationPassed, setValidationPassed] = React.useState(false);
  const [, setError] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isPreparingFiles, setIsPreparingFiles] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [uploadCompleted, setUploadCompleted] = React.useState(false);
  const [errorFiles, setErrorFiles] = React.useState<string[]>([]);
  const [duplicateFiles, setDuplicateFiles] = React.useState<string[]>([]);
  const [missingFiles, setMissingFiles] = React.useState<string[]>([]);
  const [excessFiles, setExcessFiles] = React.useState<string[]>([]);

  // Helper to extract metadata from Excel file
  const handleMetadataInput = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const temp = [];
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]]) as Record<string, string>[];
      temp.push(sheetData);
    }
    setMetadata(temp);
    return temp;
  };

  // Handle directory selection and validation
  const handleDirectoryInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setValidationPassed(false);
    setFiles(null);
    setMetadata([]);
    setUploadCompleted(false);
    setIsPreparingFiles(true);

    // Reset error states
    setErrorFiles([]);
    setDuplicateFiles([]);
    setMissingFiles([]);
    setExcessFiles([]);

    const targetFiles = event.target.files;
    if (!targetFiles) return;

    // Find the Excel file (by extension, not MIME type)
    const excelFile = Array.from(targetFiles).find(file =>
      file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    );

    let metaData: Record<string, string>[][] = [];
    if (excelFile) {
      metaData = await handleMetadataInput(excelFile);
    }

    setFiles(targetFiles);
    setMetadata(metaData);

    // Validate on server
    const response = await fetch("/api/validate-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaData,
        files: Array.from(targetFiles).map(f => ({ name: f.name })),
      }),
    });
    const result = await response.json();

    // Parse errors into categories
    if (result.errors) {
      setError(""); // Clear generic error
      const errorList: string[] = [];
      let duplicates: string[] = [];
      let missing: string[] = [];
      let excess: string[] = [];

      result.errors.forEach((err: string) => {
        if (err.startsWith("Duplicate file paths:")) {
          duplicates = err.replace("Duplicate file paths:", "").split(",").map(s => s.trim()).filter(Boolean);
        } else if (err.startsWith("Missing files:")) {
          missing = err.replace("Missing files:", "").split(",").map(s => s.trim()).filter(Boolean);
        } else if (err.startsWith("Excess files:")) {
          excess = err.replace("Excess files:", "").split(",").map(s => s.trim()).filter(Boolean);
        } else {
          errorList.push(err);
        }
      });

      setErrorFiles(errorList);
      setDuplicateFiles(duplicates);
      setMissingFiles(missing);
      setExcessFiles(excess);
      setValidationPassed(false);
    } else {
      setError("");
      setErrorFiles([]);
      setDuplicateFiles([]);
      setMissingFiles([]);
      setExcessFiles([]);
      setValidationPassed(true);
    }
    setIsPreparingFiles(false);
  };

  // Upload records and files
  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setUploadCompleted(false);
    setIsPreparingFiles(true);
    setError("");
    setUploadProgress({ current: 0, total: 0 });

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated.");
      setIsPreparingFiles(false);
      return;
    }
    const idToken = await user.getIdToken();

    // Prepare files: read all as base64 except Excel
    const uploadableFiles = Array.from(files).filter(
      file => !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')
    );

    setUploadProgress({ current: 0, total: uploadableFiles.length });

    // Read files one by one to avoid memory overflow
    const filesWithBase64: { name: string; data: string }[] = [];
    for (let i = 0; i < uploadableFiles.length; i++) {
      const file = uploadableFiles[i];
      // eslint-disable-next-line no-await-in-loop
      const base64File = await new Promise<{ name: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (!base64) {
            reject(new Error(`Could not read file data for ${file.name}`));
          } else {
            resolve({ name: file.name, data: base64 });
          }
        };
        reader.onerror = reject;
      });
      filesWithBase64.push(base64File);
      setUploadProgress({ current: i + 1, total: uploadableFiles.length });
    }

    setIsPreparingFiles(false);
    setIsUploading(true);

    // Send all data in one request (API expects all files at once)
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaData,
        files: filesWithBase64,
        idToken,
      }),
    });
    const result = await response.json();

    setIsUploading(false);

    if (result.error || (result.errors && result.errors.length > 0)) {
      setError(result.error || result.errors.join('\n'));
      return;
    }

    setUploadCompleted(true);
  };

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
            disabled={isUploading || isPreparingFiles}
          />
          {!isPreparingFiles && validationPassed && (
            <button
              onClick={handleUpload}
              disabled={isUploading || isPreparingFiles}
            >
              {isUploading ? "Uploading..." : "Upload Directory"}
            </button>
          )}
        </div>
        {isUploading && (
          <div style={{ display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ color: "white", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Uploading Files...</h2>
            <OrbitProgress color="#ffffff" size="medium" textColor="white" />
          </div>
        )}
        {isPreparingFiles && (
          <div style={{ display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ color: "white", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Preparing Files...</h2>
            <OrbitProgress color="#ffffff" size="medium" textColor="white" />
          </div>
        )}
        {uploadCompleted && (
          <div style={{ display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ color: "white", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Upload Completed!</h2>
          </div>
        )}
        {(errorFiles.length > 0 || duplicateFiles.length > 0 || missingFiles.length > 0 || excessFiles.length > 0) && (
          <div className={classes.errorContainer}>
            {errorFiles.length > 0 && (
              <div className="error-files">
                <h3>Error Files:</h3>
                <ul>
                  {errorFiles.map((err, index) => (
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
        )}
        {uploadProgress.total > 0 && (
          <div>
            Progress: {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default Upload;