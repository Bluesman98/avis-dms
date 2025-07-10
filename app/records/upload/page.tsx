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
  const [uploadProgress, setUploadProgress] = React.useState<{ current: number; total: number }>({ current: 0, total: 10 });
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

    // Safely parse JSON or handle error
    let result;
    try {
      result = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError("Server returned an invalid response. Please try again or contact support.");
      setIsPreparingFiles(false);
      return;
    }

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

    // Get Firebase ID token if needed
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

    const uploadableFiles = Array.from(files).filter(
      file => !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')
    );

    setUploadProgress({ current: 0, total: uploadableFiles.length });

    let uploadedCount = 0;
    let anyError = false;

    // Parallel uploads (limit concurrency)
    const CONCURRENCY = 4;
    const queue = [...uploadableFiles];
    const uploadNext = async () => {
      const file = queue.shift();
      if (!file) return;
      try {
        // 1. Create DB record to get _id
        const dbRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metaData,
            files: [{
              name: file.name,
              // Optionally: meta: findMetaForFile(metaData, file.name),
            }],
            idToken,
          }),
        });
        const dbResult = await dbRes.json();
        if (!dbRes.ok || !dbResult.records || !dbResult.records[0]?.id) {
          throw new Error(`Failed to create DB record for ${file.name}`);
        }
        const recordId = dbResult.records[0].id;

        // 2. Get pre-signed URL with _id in the filename
        const s3FileName = `${recordId}_${file.name}`;
        const presignRes = await fetch("/api/presign-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: s3FileName,
            fileType: file.type || "application/octet-stream",
          }),
        });
        const { url } = await presignRes.json();
        if (!url) throw new Error("Failed to get presigned URL");

        // 3. Upload file directly to S3
        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name} to S3`);

      } catch (err: unknown) {
        setError(prev => {
          let errorMsg = '';
          if (err instanceof Error) {
            errorMsg = err.message;
          } else if (typeof err === 'string') {
            errorMsg = err;
          } else {
            errorMsg = JSON.stringify(err);
          }
          return prev + `\n${file.name}: ${errorMsg}`;
        });
        anyError = true;
      }
      uploadedCount += 1;
      setUploadProgress({ current: uploadedCount, total: uploadableFiles.length });
      await uploadNext();
    };

    setIsPreparingFiles(false);
    setIsUploading(true);

    await Promise.all(Array(CONCURRENCY).fill(0).map(uploadNext));

    setIsUploading(false);

    if (!anyError) setUploadCompleted(true);
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
            <div style={{ color: "white", marginTop: "0.5rem" }}>
              Progress: {uploadProgress.current} / {uploadProgress.total} files (
              {uploadProgress.total > 0
                ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
                : 0
              }%)
            </div>
            <div style={{ width: 300, background: "white", borderRadius: 4, marginTop: 8 }}>
              <div
                style={{
                  width: `${uploadProgress.total > 0
                    ? (uploadProgress.current / uploadProgress.total) * 100
                    : 0
                    }%`,
                  background: "#1E90FF",
                  height: 12,
                  borderRadius: 4,
                  transition: "width 0.2s"
                }}
              />
            </div>
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
      </div>
    </ProtectedRoute>
  );
}

export default Upload;