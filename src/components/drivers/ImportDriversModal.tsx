"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

const COLUMN_ALIASES: Record<string, string> = {
  "first name": "firstName",
  firstname: "firstName",
  first: "firstName",
  "last name": "lastName",
  lastname: "lastName",
  last: "lastName",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  email: "email",
  "email address": "email",
  "cdl number": "cdlNumber",
  "cdl #": "cdlNumber",
  cdl: "cdlNumber",
  "cdl state": "cdlState",
  state: "cdlState",
  "cdl expiry": "cdlExpiry",
  "cdl expiration": "cdlExpiry",
  "med card expiry": "medCardExpiry",
  "med card expiration": "medCardExpiry",
  "medcard expiry": "medCardExpiry",
  "years experience": "experienceYears",
  experience: "experienceYears",
  "experience years": "experienceYears",
};

/** Minimal CSV parser handling quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function csvToRows(text: string): Record<string, string>[] {
  const parsed = parseCsv(text);
  if (parsed.length < 2) return [];

  const headers = parsed[0].map(
    (header) => COLUMN_ALIASES[header.trim().toLowerCase()] ?? ""
  );

  return parsed.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (key && cells[i] != null) row[key] = cells[i].trim();
    });
    return row;
  });
}

export function ImportDriversModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [importing, setImporting] = useState(false);

  async function handleFile(file: DroppedFile) {
    setImporting(true);
    try {
      const base64 = file.dataUrl.split(",")[1] ?? "";
      const text = atob(base64);
      const rows = csvToRows(text);

      if (rows.length === 0) {
        toast(
          "error",
          "Couldn't read the spreadsheet",
          "Make sure the first row has headers like First Name, Last Name, Phone."
        );
        return;
      }

      const result = await api<{ imported: number; skipped: number }>(
        "/api/drivers/import",
        { method: "POST", json: { rows } }
      );

      toast(
        "success",
        `Imported ${result.imported} driver${result.imported === 1 ? "" : "s"}`,
        result.skipped > 0
          ? `${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped (missing names).`
          : undefined
      );
      onDone();
      onClose();
    } catch (error) {
      toast("error", "Import failed", (error as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import existing drivers"
      subtitle="Upload a CSV exported from Excel or Google Sheets."
    >
      <div className="space-y-4">
        <FileDrop
          label="Upload spreadsheet (.csv)"
          sublabel="Drag & drop or tap to browse"
          accept=".csv,text/csv"
          busy={importing}
          onFile={handleFile}
        />
        <div className="rounded-xl bg-accent-soft px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            <FileSpreadsheet size={15} />
            Columns we understand
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
            First Name, Last Name, Phone, Email, CDL Number, CDL State, CDL
            Expiry, Med Card Expiry, Years Experience. Extra columns are ignored
            — no need for a perfect file.
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
