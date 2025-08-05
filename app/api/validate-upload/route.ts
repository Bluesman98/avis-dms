import { NextRequest, NextResponse } from "next/server";
import { fetchCategory } from "@/app/records/upload/upload";

export async function POST(request: NextRequest) {
  const { metaData, files } = await request.json();
  const errors: string[] = [];
  const sheetFileNames = new Set<string>();
  const fileNames = files.map((file: { name: string }) => file.name);
  const missingFilesList: string[] = [];
  const excessFilesList: string[] = [];
  const duplicateFilesList: string[] = [];
  const seenFilePaths = new Set<string>();

  // Excel file check (by extension, ignore temp/hidden files)
  const excelFiles = fileNames.filter((name: string) => {
    const lower = name.toLowerCase();
    return (
      (lower.endsWith(".xlsx") ||
        lower.endsWith(".xls") ||
        lower.endsWith(".xlsm")) &&
      !lower.startsWith("~$")
    );
  });

  if (excelFiles.length !== 1) {
    errors.push(
      `Exactly one Excel file (.xlsx or .xls) is required, but found ${
        excelFiles.length
      }. ${excelFiles.join(", ")}`
    );
  }

  // Treat metaData as a flat array of rows
  if (Array.isArray(metaData)) {
    for (const row of metaData) {
      const filePath = (row["file_path"] || "").trim();
      if (!filePath) {
        errors.push(`Row has an empty or undefined file_path.`);
        continue;
      }
      const fileName = filePath.split("\\").pop() || "";
      if (fileName && /^[^\\\/]+\.pdf$/i.test(fileName)) {
        sheetFileNames.add(fileName);
        if (seenFilePaths.has(filePath)) {
          duplicateFilesList.push(filePath);
        } else {
          seenFilePaths.add(filePath);
        }
        if (!fileNames.includes(fileName)) {
          missingFilesList.push(fileName);
        }
      } else if (!fileName) {
        errors.push(`Malformed file_path: "${filePath}"`);
      }

      const categoryName = row["category_name"];
      if (!categoryName) {
        errors.push(`Row is missing a category_name.`);
        continue;
      }
      const category = await fetchCategory(categoryName);
      if (!category || category.length === 0) {
        errors.push(
          `Category "${categoryName}" does not exist in the database.`
        );
        continue;
      }

      const categoryFields = new Set(
        Object.keys(category[0]).filter(
          (key) =>
            typeof category[0][key] === "boolean" &&
            category[0][key] === true &&
            key !== "id" &&
            key !== "category_name"
        )
      );
      const rowFields = Object.keys(row);
      const missingFields = Array.from(categoryFields).filter(
        (field) => !rowFields.includes(field)
      );
      if (missingFields.length > 0) {
        errors.push(
          `Row is missing required fields: ${missingFields.join(", ")}`
        );
        continue;
      }
    }
  } else {
    errors.push("metaData is not an array.");
  }

  // Optionally, check for excess files
  const excessFiles = fileNames.filter(
    (name: string) => !sheetFileNames.has(name) && !excelFiles.includes(name)
  );
  if (excessFiles.length > 0) {
    excessFilesList.push(...excessFiles);
  }

  // Format error output for client
  if (duplicateFilesList.length > 0) {
    errors.push(`Duplicate file paths: ${duplicateFilesList.join(", ")}`);
  }
  if (missingFilesList.length > 0) {
    errors.push(`Missing files: ${missingFilesList.join(", ")}`);
  }
  if (excessFilesList.length > 0) {
    errors.push(`Excess files: ${excessFilesList.join(", ")}`);
  }

  return NextResponse.json({ errors });
}
