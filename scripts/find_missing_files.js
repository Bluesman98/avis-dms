import xlsx from "xlsx";
const { readFile, utils } = xlsx;
import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config } from "dotenv";
import fs from "fs";

// Get __dirname in ES module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.production
config({ path: resolve(__dirname, "../.env.production") });

// Use DATABASE_URL from env
const sql = neon(process.env.DATABASE_URL);

const excelFilePath = "C:\\Users\\gpap\\Desktop\\Batch_3_Part2\\Part2.xlsx"; // Path to your Excel file
const fileNameColumn = "file_path"; // Now comparing full file_path
const tableName = "records"; // Adjust if your table is named differently
const outputFilePath = "C:\\Users\\gpap\\source\\repos\\dms\\missing_files.txt"; // Output file for missing paths

async function main() {
    // 1. Read Excel and extract file paths + metadata
    const workbook = readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const metaData = utils.sheet_to_json(sheet);

    // Map: file_path => metadata row
    const metaMap = new Map();
    for (const row of metaData) {
        if (typeof row === "object" &&
            row !== null &&
            "file_path" in row &&
            typeof row.file_path === "string") {
            metaMap.set(row.file_path, row);
        }
    }
    const expectedFilePaths = Array.from(metaMap.keys());

    // 2. Query Neon DB for uploaded file paths
    const res = await sql(`SELECT ${fileNameColumn} FROM ${tableName}`);
    const uploadedFilePaths = res.map(row => row[fileNameColumn]);

    // 3. Find missing file paths
    const missingFilePaths = expectedFilePaths.filter(path => !uploadedFilePaths.includes(path));
    console.log("Missing file paths:", missingFilePaths);
    console.log("Missing files count:", missingFilePaths.length);

    // 4. Write missing file paths to a text file
    fs.writeFileSync(outputFilePath, missingFilePaths.join("\n"), "utf-8");
    console.log(`Missing file paths written to ${outputFilePath}`);
}

main().catch(function (err) {
    console.error("Error:", err);
});