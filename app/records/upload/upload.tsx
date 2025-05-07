'use server'
import { neon } from '@neondatabase/serverless';

export async function createRecord(
  categoryId: number,
  recordData: Partial<{
    folderName: string;
    subFolderName: string;
    range: string;
    fileName: string;
    filePath: string;
    area: string;
    year: string;
    protocolNo: string;
    buildingBlock: string;
    aproovalNo: string;
    subCategory: string;
  }>
): Promise<number> {
  'use server';
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);

  // Dynamically construct the fields and values for the SQL query
  const fields = ['category_id', ...Object.keys(recordData)];
  const values = [categoryId, ...Object.values(recordData)];

  // Dynamically construct the SQL query
  const fieldsString = fields.map((field) => `"${field}"`).join(', ');
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
  const query = `INSERT INTO records (${fieldsString}) VALUES (${placeholders}) RETURNING id`;

  console.log('Fields:', fields);
  console.log('Values:', values);

  // Execute the query and return the inserted ID
  const result = await sql(query, values);
  const insertedId = result[0]?.id;

  console.log('Record created successfully with ID:', insertedId);
  return insertedId;
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