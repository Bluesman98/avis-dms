"use client";

interface ValidationResult {
    message?: string;
    category: string;
    keyField: string;
    headers: string[];
    rowCount: number;
    preview?: Record<string, unknown>[];
    error?: string;
    validCount?: number;
    invalidCount?: number;
    invalidRows?: Array<{ row: number; data: Record<string, unknown>; error: string }>;
}

interface UpdateResult {
    updatedCount: number;
    missingCount: number;
    errorCount: number;
    updated: string[];
    missing: string[];
    errors: string[];
}

import React, { useState } from "react";
// import { saveAs } from "file-saver"; // Not used
import * as XLSX from "xlsx";

type UpdateRecordsProps = {
    categories: string[];
};

function UpdateRecords({ categories }: UpdateRecordsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("");
    const [keyField, setKeyField] = useState("");
    const [jsonData, setJsonData] = useState<Record<string, unknown>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [validationPassed, setValidationPassed] = useState(false);
    const [validationLogUrl, setValidationLogUrl] = useState<string | undefined>(undefined);
    const [logUrl, setLogUrl] = useState<string | undefined>(undefined);
    // Removed unused updateResult
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Parse Excel file to JSON
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setFile(f || null);
        setJsonData([]);
        setHeaders([]);
        setValidation(null);
        setError(null);
        if (f) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { defval: null });
                setJsonData(json as Record<string, unknown>[]);
                setHeaders(json.length > 0 ? Object.keys(json[0] as object) : []);
            };
            reader.readAsArrayBuffer(f);
        }
    };
    // Removed setUpdateResult(null);

    // Validate data with backend
    const handleValidate = async () => {
        setLoading(true);
        setError(null);
        setValidation(null);
        setValidationLogUrl(undefined);
        try {
            const res = await fetch("/api/validate-update-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: jsonData, category, keyField }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Validation failed");
            setValidation(data);
            // Validation passes if there are no invalid rows
            setValidationPassed((data.invalidCount ?? 0) === 0);
            // Generate validation log text
            const logText = generateValidationLogText(data);
            const blob = new Blob([logText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            setValidationLogUrl(url);
        } catch (err) {
            setValidationPassed(false);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    // Helper to generate validation log text
    function generateValidationLogText(result: ValidationResult): string {
        if (!result) return "No validation result.";
        let log = "Validation Report\n";
        log += `Category: ${result.category || "-"}\n`;
        log += `Key Field: ${result.keyField || "-"}\n`;
        log += `Row Count: ${result.rowCount || 0}\n`;
        log += `Headers: ${(result.headers || []).join(", ")}\n`;
        // Only count errored rows as invalid
        const errorRows = Array.isArray(result.invalidRows) ? result.invalidRows.length : 0;
        const validRows = (result.rowCount || 0) - errorRows;
        log += `Valid Rows: ${validRows}\n`;
        log += `Invalid Rows: ${errorRows}\n`;
        log += `Status: ${errorRows === 0 ? "PASSED" : "FAILED"}\n\n`;
        if (result.invalidRows && result.invalidRows.length > 0) {
            log += "Error Rows:\n";
            result.invalidRows.forEach((rowObj) => {
                log += `Row ${rowObj.row}: ${JSON.stringify(rowObj.data)} | Error: ${rowObj.error}\n`;
            });
            log += "\n";
        }
        if (result.error) {
            log += `Warning/Error: ${result.error}\n`;
        }
        return log;
    }

    // Perform update
    const handleUpdate = async () => {
        setLoading(true);
        setError(null);
        setLogUrl(undefined);
        try {
            const res = await fetch("/api/update-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: jsonData, category, keyField }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            // Generate log text
            const logText = generateLogText(data);
            const blob = new Blob([logText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            setLogUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    // Helper to generate log text from update result
    function generateLogText(result: UpdateResult): string {
        if (!result) return "No result.";
        let log = "Update Report\n";
        log += `Updated: ${result.updatedCount || 0}\n`;
        log += `Missing: ${result.missingCount || 0}\n`;
        log += `Errors: ${result.errorCount || 0}\n\n`;
        if (Array.isArray(result.updated)) {
            log += "Updated Records:\n" + result.updated.join("\n") + "\n\n";
        }
        if (Array.isArray(result.missing) && result.missing.length > 0) {
            log += "Missing Records:\n" + result.missing.join("\n") + "\n\n";
        }
        if (Array.isArray(result.errors) && result.errors.length > 0) {
            log += "Errors:\n" + result.errors.join("\n") + "\n\n";
        }
        return log;
    }

    return (
        <div className="max-w-xl mx-auto p-4 border rounded bg-white shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">Update Records from Excel</h2>
            <div className="mb-4">
                <label className="block font-medium mb-1">Select Category:</label>
                <select
                    className="border rounded px-2 py-1 w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {categories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">Excel File:</label>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            </div>
            {headers.length > 0 && (
                <div className="mb-4">
                    <label className="block font-medium mb-1">Select Key Field:</label>
                    <select
                        className="border rounded px-2 py-1 w-full"
                        value={keyField}
                        onChange={(e) => setKeyField(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="mb-4 flex gap-2">
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={handleValidate}
                    disabled={loading || !file || !category || !keyField}
                >
                    Validate
                </button>
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={handleUpdate}
                    disabled={loading || !validationPassed}
                >
                    Update
                </button>
            </div>
            {loading && <div className="text-blue-600 mb-2">Processing...</div>}
            {error && <div className="text-red-600 mb-2">Error: {error}</div>}
            {validation && (
                <div className={`p-4 mt-4 rounded ${validationPassed ? "bg-green-50 border border-green-300" : "bg-yellow-50 border border-yellow-300"}`}>
                    <div className="font-semibold mb-2">Validation Summary:</div>
                    <div><b>Category:</b> {validation.category}</div>
                    <div><b>Key Field:</b> {validation.keyField}</div>
                    <div><b>Row Count:</b> {validation.rowCount}</div>
                    <div><b>Headers:</b> {(validation.headers || []).join(", ")}</div>
                    {/* Only count errored rows as invalid */}
                    <div><b>Valid Rows:</b> {(validation.rowCount || 0) - (Array.isArray(validation.invalidRows) ? validation.invalidRows.length : 0)}</div>
                    <div><b>Invalid Rows:</b> {Array.isArray(validation.invalidRows) ? validation.invalidRows.length : 0}</div>
                    <div><b>Status:</b> <span className={validationPassed ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{validationPassed ? "PASSED" : "FAILED"}</span></div>
                    {validation.invalidRows && validation.invalidRows.length > 0 && (
                        <div className="mt-2">
                            <b>Error Rows:</b>
                            <pre className="text-xs whitespace-pre-wrap">
                                {validation.invalidRows.map((rowObj) => `Row ${rowObj.row}: ${JSON.stringify(rowObj.data)} | Error: ${rowObj.error}`).join("\n")}
                            </pre>
                        </div>
                    )}
                    {validation.error && (
                        <div className="text-yellow-700 font-semibold mt-2">Warning: {validation.error}</div>
                    )}
                    {validationLogUrl && (
                        <a
                            href={validationLogUrl}
                            download={`validation-log-${Date.now()}.txt`}
                            className="bg-blue-600 text-white px-4 py-2 rounded w-fit mt-2 inline-block"
                        >
                            Download Validation Log
                        </a>
                    )}
                </div>
            )}
            {logUrl && (
                <div className="bg-green-50 border border-green-300 p-2 mt-2 rounded flex flex-col gap-2 mt-4">
                    <div className="font-semibold">Update Log:</div>
                    <a
                        href={logUrl}
                        download={`update-log-${Date.now()}.txt`}
                        className="bg-blue-600 text-white px-4 py-2 rounded w-fit"
                    >
                        Download Log
                    </a>
                </div>
            )}
        </div>
    );
}

export default UpdateRecords;
