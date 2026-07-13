"use client";

import { motion } from "framer-motion";
import { UploadCloud, FileCheck2, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export interface DroppedFile {
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export function readFileAsDataUrl(file: File): Promise<DroppedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(new Error("Couldn't read the file."));
    reader.readAsDataURL(file);
  });
}

export function FileDrop({
  label,
  sublabel = "Drag & drop or tap to browse",
  accept = "image/*,.pdf",
  busy,
  done,
  multiple,
  onFile,
}: {
  label: string;
  sublabel?: string;
  accept?: string;
  busy?: boolean;
  done?: boolean;
  multiple?: boolean;
  onFile: (file: DroppedFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const list = multiple ? Array.from(files) : [files[0]];
      for (const file of list) {
        onFile(await readFileAsDataUrl(file));
      }
    },
    [onFile, multiple]
  );

  return (
    <motion.button
      type="button"
      disabled={busy}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      animate={{ scale: dragging ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
        dragging
          ? "border-accent bg-accent-soft"
          : done
            ? "border-success/50 bg-success-soft"
            : "border-border-strong bg-surface-solid hover:border-accent/50 hover:bg-accent-soft/50"
      } ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {busy ? (
        <Loader2 size={22} className="animate-spin text-accent" />
      ) : done ? (
        <FileCheck2 size={22} className="text-success" />
      ) : (
        <UploadCloud size={22} className="text-accent" />
      )}
      <div>
        <p className="text-sm font-medium">{done ? "Uploaded" : label}</p>
        <p className="mt-0.5 text-xs text-ink-tertiary">
          {busy ? "Reading document…" : done ? "Tap to replace" : sublabel}
        </p>
      </div>
    </motion.button>
  );
}
