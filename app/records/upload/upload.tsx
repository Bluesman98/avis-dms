'use server'
import { neon } from '@neondatabase/serverless';

const ALLOWED_FIELDS = [
  "category_id",
  "ar_kikloforias",
  "imerominia_elegxou",
  "ar_simvolaiou",
  "ar_protokollou",
  "ar_parartimatos",
  "file_path",
  "id",
];

export async function createRecord(
  recordData: Partial<Record<string, string | number>>
): Promise<number> {
  'use server';
  const sql = neon(`${process.env.DATABASE_URL}`);

  // Filter only allowed fields
  const filteredEntries = Object.entries(recordData).filter(([key]) =>
    ALLOWED_FIELDS.includes(key)
  );
  const fields = filteredEntries.map(([key]) => key);
  const values = filteredEntries.map(([, value]) => value);

  if (fields.length === 0) {
    throw new Error("No valid fields to insert");
  }

  const fieldsString = fields.map((field) => `"${field}"`).join(', ');
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
  const query = `INSERT INTO records (${fieldsString}) VALUES (${placeholders}) RETURNING id`;

  console.log('Fields:', fields);
  console.log('Values:', values);

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

export async function fetchCategory(category: string): Promise<{ [key: string]: string | number }[]> {
  'use server'
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // Insert the comment from the form into the Postgres database
  const response = await sql`SELECT * FROM categories WHERE category_name = ${category}`;
  console.log(response)
  return response
}