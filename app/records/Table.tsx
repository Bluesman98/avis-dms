import Record from "./Record";

function Table({ records, fields }: { records: any, fields: string[] }) {

  if (!records.length) {return(<div className="text-center">No records found</div>)}
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {fields.includes('folderName') && <th className="py-2">Folder Name</th>}
          {fields.includes('subFolderName') && <th className="py-2">Sub Folder Name</th>}
          {fields.includes('range') && <th className="py-2">Range</th>}
          {fields.includes('category') && <th className="py-2">Category</th>}
          {fields.includes('filePath') && <th className="py-2">File Path</th>}
          {fields.includes('area') && <th className="py-2">Area</th>}
          {fields.includes('year') && <th className="py-2">Year</th>}
          {fields.includes('protocolNo') && <th className="py-2">Protocol No</th>}
          {fields.includes('buildingBlock') && <th className="py-2">Building Block</th>}
          {fields.includes('aproovalNo') && <th className="py-2">Approval No</th>}
          {fields.includes('subCategory') && <th className="py-2">Sub Category</th>}
          <th className="py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record: any) => (
          <Record key={record.id} record={record} fields={fields} />
        ))}
      </tbody>
    </table>
  );
}

export default Table;