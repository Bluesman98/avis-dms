'use server'
import { neon } from '@neondatabase/serverless';
export async function createRecord(
    categoryId: number,
    folderName: string,
    subFolderName: string,
    range: string,
    fileName: string,
    filePath: string,
    area: string,
    year: string,
    protocolNo: string,
    buildingBlock: string,
    aproovalNo: string,
    subCategory: string
  ) {
    'use server'
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql`INSERT INTO kilkis (category_id, folder_name, subFolder_name, range, file_name, file_path, area, year, protocol_no, building_block, aprooval_no, subcategory) VALUES (${categoryId}, ${folderName}, ${subFolderName}, ${range}, ${fileName}, ${filePath}, ${area}, ${year}, ${protocolNo}, ${buildingBlock}, ${aproovalNo}, ${subCategory})`;
  }

  export async function createCategory(
    categoryName: string,
    folderName: boolean,
    subFolderName: boolean,
    range: boolean,
    fileName: boolean,
    filePath: boolean,
    area: boolean,
    year: boolean,
    protocolNo: boolean,
    buildingBlock: boolean,
    aproovalNo: boolean,
    subCategory: boolean
  ) {
    'use server'
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`INSERT INTO categories (category_name, folder_name, subFolder_name, range, file_name, file_path, area, year, protocol_no, building_block, aprooval_no, subcategory) VALUES (${categoryName},${folderName}, ${subFolderName}, ${range}, ${fileName}, ${filePath}, ${area}, ${year}, ${protocolNo}, ${buildingBlock}, ${aproovalNo}, ${subCategory})`;
    return response
  }

  export async function fetchCategory(category :string): Promise<{ [key: string]: string | number }[]> {
    'use server'
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
  const response = await sql`SELECT * FROM categories WHERE category_name = ${category}`;
  console.log(response)
  return response
  }