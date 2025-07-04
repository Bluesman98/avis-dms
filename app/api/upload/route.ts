import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "../../../lib/s3";
import { getAuth, getFirestore } from "../../../lib/firebaseAdmin";
import { createRecord, fetchCategory } from "@/app/records/upload/upload";

export async function POST(request: NextRequest) {
  const { metaData, files, idToken } = await request.json();

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

    // 1. Create records and map file names to record IDs
    const uploadedRecords: { id: number; fileName: string }[] = [];
    for (const sheet of metaData) {
      for (const row of sheet) {
        const categoryName = row["category_name"];
        if (!categoryName) continue;
        const category = await fetchCategory(categoryName);
        if (!category || category.length === 0) continue;
        const categoryId = Number(category[0].id);

        // Use the correct allowed fields
        const allowedColumns = [
          "category_id",
          "ar_kikloforias",
          "imerominia_elegxou",
          "ar_simvolaiou",
          "ar_protokollou",
          "ar_parartimatos",
          "file_path",
          "id",
        ];
        const recordDataRaw = Object.fromEntries(
          Object.entries(row).filter(([key]) => allowedColumns.includes(key))
        );
        // Ensure category_id and category_name are present
        recordDataRaw.category_id = categoryId;
        recordDataRaw.category_name = categoryName;

        // Cast all values to string or number
        const recordData: Partial<Record<string, string | number>> = {};
        for (const [key, value] of Object.entries(recordDataRaw)) {
          if (typeof value === "string" || typeof value === "number") {
            recordData[key] = value;
          } else if (value !== undefined && value !== null) {
            recordData[key] = String(value);
          }
        }

        const recordId = await createRecord(recordData);
        const fileName = row["file_path"]?.split("\\").pop();
        if (fileName) {
          uploadedRecords.push({ id: recordId, fileName });
        }
      }
    }

    // 2. Upload files to S3 with new record IDs in the filename
    const uploadResults = [];
    for (const fileObj of files) {
      // fileObj: { name: string, data: string (base64) }
      const record = uploadedRecords.find((r) => r.fileName === fileObj.name);
      if (!record) continue;
      const newFileName = `${record.id}_${fileObj.name}`;
      const result = await uploadFile(
        Buffer.from(fileObj.data, "base64"),
        newFileName,
        process.env.AWS_S3_BUCKET_NAME!
      );
      uploadResults.push({ fileName: newFileName, ...result });
    }

    return NextResponse.json({
      records: uploadResults,
      message: "Files uploaded and records created successfully",
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        message: "File upload failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
