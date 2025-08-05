/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import React from "react";

const formContainerStyle: React.CSSProperties = {
    maxWidth: 1000,
    margin: "2rem auto",
    padding: "2rem",
    background: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
};

const gridStyleBase: React.CSSProperties = {
    display: "grid",
    gap: "1.5rem",
    marginBottom: "2rem",
};

const fieldRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
};

const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    marginBottom: "0.3rem",
    color: "#333",
};

const inputStyle: React.CSSProperties = {
    padding: "0.5rem",
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: "1rem",
};

const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "1rem",
    marginTop: "1.5rem",
};

const errorStyle: React.CSSProperties = {
    color: "#c00",
    background: "#ffeaea",
    padding: "0.5rem 1rem",
    borderRadius: 4,
    marginBottom: "1rem",
    fontWeight: 500,
};

function getGridColumns(): number {
    if (typeof window === "undefined") return 2;
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    if (window.innerWidth < 1200) return 3;
    return 4;
}

const EditRecordPage = () => {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const [record, setRecord] = useState<Record<string, unknown>>({});
    const [fields, setFields] = useState<string[]>([]);
    const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [columns, setColumns] = useState<number>(getGridColumns());

    useEffect(() => {
        function handleResize() {
            setColumns(getGridColumns());
        }
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        async function fetchRecord() {
            try {
                if (id) {
                    const res = await fetch(`/api/records/${id}`);
                    const data = await res.json();
                    setRecord(data || {});
                    const categoryId = data?.category_id;
                    if (categoryId) {
                        const catRes = await fetch(`/api/category/${categoryId}`);
                        const catData = await catRes.json();
                        setFields(catData.fields.map((f: any) => f.field));
                        const names: Record<string, string> = {};
                        catData.fields.forEach((f: any) => {
                            names[f.field] = f.displayName;
                        });
                        setDisplayNames(names);
                    } else {
                        setFields([]);
                        setDisplayNames({});
                    }
                }
            } catch {
                setError("Failed to fetch record");
            }
        }
        if (id) fetchRecord();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRecord({ ...record, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setError(null);
        try {
            const res = await fetch(`/api/records/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Update failed");
                return;
            }
            router.push("/records");
        } catch {
            setError("Network error");
        }
    };

    // Dynamic grid columns
    const gridStyle: React.CSSProperties = {
        ...gridStyleBase,
        gridTemplateColumns: `repeat(${columns}, minmax(220px, 1fr))`,
    };

    return (
        <div style={formContainerStyle}>
            <h1 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "2rem", color: "#222" }}>
                Edit Record #{id}
            </h1>
            {error && <div style={errorStyle}>{error}</div>}
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div style={gridStyle}>
                    {fields.map(field => (
                        <div key={field} style={fieldRowStyle}>
                            <label style={labelStyle}>{displayNames[field] || field}</label>
                            <input
                                style={inputStyle}
                                name={field}
                                value={typeof record[field] === "string" || typeof record[field] === "number" ? record[field] : ""}
                                onChange={handleChange}
                            />
                        </div>
                    ))}
                </div>
                <div style={buttonRowStyle}>
                    <button
                        type="submit"
                        style={{
                            padding: "0.7rem 1.5rem",
                            background: "#1976d2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        style={{
                            padding: "0.7rem 1.5rem",
                            background: "#eee",
                            color: "#333",
                            border: "none",
                            borderRadius: 4,
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditRecordPage;