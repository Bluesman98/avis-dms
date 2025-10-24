import { NextRequest, NextResponse } from "next/server";
import { getAuth, getFirestore } from "../../../lib/firebaseAdmin";
import { createRecord, fetchCategory } from "@/app/records/upload/upload";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

export async function POST(request: NextRequest) {
  const { metaData, files, idToken } = await request.json();

  // Reject files named 'trigger_error.txt' for testing upload error logging
  if (
    files &&
    Array.isArray(files) &&
    files.some((f: { name: string }) => f.name === "trigger_error.pdf")
  ) {
    return NextResponse.json(
      {
        error:
          "Upload of 'trigger_error.txt' is intentionally blocked for testing.",
      },
      { status: 400 }
    );
  }

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json(
      { error: "No Firebase ID token provided" },
      { status: 401 }
    );
  }

  if (
    !metaData ||
    !Array.isArray(metaData) ||
    !files ||
    !Array.isArray(files)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid metaData/files" },
      { status: 400 }
    );
  }

  try {
    // Verify token and check admin role
    const decoded = await getAuth().verifyIdToken(idToken);
    const userDoc = await getFirestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const userData = userDoc.data();
    if (
      !userDoc.exists ||
      !(
        userData &&
        Array.isArray(userData.roles) &&
        userData.roles.includes("admin")
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build a lookup map from file name to metadata row
    const metaMap = new Map<string, object>();
    for (const row of metaData) {
      if (
        typeof row === "object" &&
        row !== null &&
        "file_path" in row &&
        typeof (row as { file_path?: string })["file_path"] === "string"
      ) {
        const fileName = ((row as { file_path: string })["file_path"] || "")
          .split("\\")
          .pop();
        if (fileName) metaMap.set(fileName, row);
      }
    }

    // Create records for each file
    const createdRecords = [];
    for (const fileObj of files) {
      // fileObj: { name: string, s3Url: string, meta: object }
      const metaRow = fileObj.meta || metaMap.get(fileObj.name);
      if (!metaRow) continue;

      const categoryName = metaRow["category_name"];
      if (!categoryName) continue;
      const category = await fetchCategory(categoryName);
      if (!category || category.length === 0) continue;
      const categoryId = Number(category[0].id);

      const filteredData = Object.fromEntries(
        Object.entries(metaRow).filter(([key]) => ALLOWED_FIELDS.includes(key))
      );
      filteredData.category_id = categoryId;
      filteredData.category_name = categoryName;
      filteredData.s3_url = fileObj.s3Url; // Save S3 URL

      // Cast all values to string or number
      const recordData: Partial<Record<string, string | number>> = {};
      for (const [key, value] of Object.entries(filteredData)) {
        if (typeof value === "string" || typeof value === "number") {
          recordData[key] = value;
        } else if (value !== undefined && value !== null) {
          recordData[key] = String(value);
        }
      }

      const recordId = await createRecord(recordData);
      createdRecords.push({
        id: recordId,
        fileName: fileObj.name,
        s3Url: fileObj.s3Url,
      });
    }

    return NextResponse.json({
      records: createdRecords,
      message: "Records created successfully",
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        message: "Record creation failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
