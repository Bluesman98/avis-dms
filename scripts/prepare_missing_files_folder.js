import fs from "fs";
import path from "path";
import xlsx from "xlsx";

// CONFIGURE THESE
const missingFilesListPath = "C:\\Users\\gpap\\source\\repos\\dms\\missing_files.txt"; // Text file with missing file paths
const sourceDirectory = "C:\\Users\\gpap\\Desktop\\avis_batch_2"; // Where your files are currently stored
const excelFilePath = "C:\\Users\\gpap\\Desktop\\avis_batch_2\\IID_INDEXING_202508010915.xlsx"; // Your Excel metadata file
const targetDirectory = "C:\\Users\\gpap\\Desktop\\missing_files_upload"; // Where to copy missing files

function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFileFlat(filePath) {
    const baseName = path.basename(filePath);
    const sourcePath = path.join(sourceDirectory, baseName);
    const targetPath = path.join(targetDirectory, baseName);

    ensureDirSync(targetDirectory);

    if (fs.existsSync(targetPath)) {
        console.log(`Skipped (already exists): ${baseName}`);
        return;
    }

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${baseName}`);
    } else {
        console.warn(`Missing source file: ${sourcePath}`);
    }
}

function main() {
    // 1. Read missing file paths
    const missingFiles = fs.readFileSync(missingFilesListPath, "utf-8")
        .split(/\r?\n/)
        .filter(line => line.trim().length > 0)
        .map(line => path.basename(line)); // Only base names

    // 2. Copy each missing file by base name only, skip if already exists
    missingFiles.forEach(copyFileFlat);

    // 3. Filter Excel metadata for missing files only
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const metaData = xlsx.utils.sheet_to_json(sheet);

    // Filter rows where file_path's base name is in missingFiles
    const filteredMeta = metaData.filter(row =>
        row.file_path && missingFiles.includes(path.basename(row.file_path))
    );

    // Write filtered metadata to new Excel file in target directory
    const newSheet = xlsx.utils.json_to_sheet(filteredMeta);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, sheetName);

    const excelTargetPath = path.join(targetDirectory, path.basename(excelFilePath));
    xlsx.writeFile(newWorkbook, excelTargetPath);
    console.log(`Filtered Excel metadata written to: ${excelTargetPath}`);

    console.log("Done preparing missing files folder.");
}

main();