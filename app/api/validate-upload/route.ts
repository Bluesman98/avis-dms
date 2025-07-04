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

  // Fill sheetFileNames and do metadata validation
  for (const sheet of metaData) {
    for (const row of sheet) {
      const filePath = (row["file_path"] || "").trim();
      if (!filePath) {
        errors.push(`Row in sheet has an empty or undefined file_path.`);
        continue;
      }
      const fileName = filePath.split("\\").pop() || "";
      // Only process if fileName is not empty and looks like a file
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
      }
      // Optionally, else warn about malformed file names
      else if (!fileName) {
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
  }

  // Now check for excess files (ignore Excel files)
  for (const fileName of fileNames) {
    const lower = fileName.toLowerCase();
    if (
      !sheetFileNames.has(fileName) &&
      !lower.endsWith(".xlsx") &&
      !lower.endsWith(".xls") &&
      !lower.endsWith(".xlsm")
    ) {
      excessFilesList.push(fileName);
    }
  }

  if (missingFilesList.length > 0)
    errors.push(`Missing files: ${missingFilesList.join(", ")}`);
  if (excessFilesList.length > 0)
    errors.push(`Excess files: ${excessFilesList.join(", ")}`);
  if (duplicateFilesList.length > 0)
    errors.push(`Duplicate file paths: ${duplicateFilesList.join(", ")}`);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
