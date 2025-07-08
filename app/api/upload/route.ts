import { NextRequest, NextResponse } from "next/server";
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

    // Create records for each file
    const createdRecords = [];
    for (const fileObj of files) {
      // fileObj: { name: string, s3Url: string, meta: object }
      // Find the corresponding metadata row if needed
      let metaRow = fileObj.meta;
      if (!metaRow && metaData.length > 0) {
        // Try to find by file name
        for (const sheet of metaData) {
          for (const row of sheet) {
            if ((row["file_path"] || "").split("\\").pop() === fileObj.name) {
              metaRow = row;
              break;
            }
          }
          if (metaRow) break;
        }
      }
      if (!metaRow) continue;

      const categoryName = metaRow["category_name"];
      if (!categoryName) continue;
      const category = await fetchCategory(categoryName);
      if (!category || category.length === 0) continue;
      const categoryId = Number(category[0].id);

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
        Object.entries(metaRow).filter(([key]) => allowedColumns.includes(key))
      );
      recordDataRaw.category_id = categoryId;
      recordDataRaw.category_name = categoryName;
      recordDataRaw.s3_url = fileObj.s3Url; // Save S3 URL

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
