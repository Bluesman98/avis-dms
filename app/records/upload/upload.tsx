'use server'
import { neon } from '@neondatabase/serverless';
export async function createRecord(
    folderName: string,
    subFolderName: string,
    range: string,
    category: string,
    filePath: string,
    area: string,
    year: string,
    protocolNo: string,
    buildingBlock: string,
    aproovalNo: string,
    subCategory: string
  ) {
    //'use server'
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql`INSERT INTO kilkis ("folderName", "subFolderName", range, category, "filePath", area, year, "protocolNo", "buildingBlock", "aproovalNo", "subCategory") VALUES (${folderName}, ${subFolderName}, ${range}, ${category}, ${filePath}, ${area}, ${year}, ${protocolNo}, ${buildingBlock}, ${aproovalNo}, ${subCategory})`;
  }