"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { discardUpload } from "@/lib/actions/campaigns";
import { ATTACHMENT_RULES, formatBytes } from "@/lib/campaigns/constants";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
}

function safeName(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return clean || "fichier";
}

export function FileUploader({
  folder,
  files,
  onChange,
}: {
  folder: string; // <user_id>/<idempotency_key>
  files: UploadedFile[];
  onChange: (updater: (prev: UploadedFile[]) => UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const total = files.reduce((s, f) => s + f.size, 0);

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    const supabase = createClient();
    let running = total;
    let count = files.length;

    for (const file of Array.from(list)) {
      if (count >= ATTACHMENT_RULES.maxFiles) {
        toast.error(`${ATTACHMENT_RULES.maxFiles} fichiers maximum.`);
        break;
      }
      if (!ATTACHMENT_RULES.accept[file.type]) {
        toast.error(`${file.name} : format non accepté (PDF, JPG, PNG, DOCX, XLSX).`);
        continue;
      }
      if (file.size > ATTACHMENT_RULES.maxFileBytes) {
        toast.error(`${file.name} : 10 Mo maximum par fichier.`);
        continue;
      }
      if (running + file.size > ATTACHMENT_RULES.maxTotalBytes) {
        toast.error("20 Mo maximum au total.");
        break;
      }
      running += file.size;
      count += 1;

      const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
      onChange((prev) => [...prev, { path, name: file.name, size: file.size, status: "uploading" }]);
      const { error } = await supabase.storage.from("devis").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      onChange((prev) => prev.map((f) => (f.path === path ? { ...f, status: error ? "error" : "done" } : f)));
      if (error) toast.error(`${file.name} : échec du téléversement.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(file: UploadedFile) {
    onChange((prev) => prev.filter((f) => f.path !== file.path));
    if (file.status === "done") await discardUpload(file.path);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm transition-colors hover:bg-muted/40",
          dragging && "border-brand bg-brand/5",
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <span className="font-medium">Ajouter votre devis (PDF)</span>
        <span className="text-xs text-muted-foreground">
          Glissez-déposez ou touchez pour choisir · PDF, JPG, PNG, DOCX, XLSX · 10 Mo / fichier · 20 Mo au total
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={Object.values(ATTACHMENT_RULES.accept).join(",")}
        onChange={(e) => handle(e.target.files)}
      />
      {files.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {files.map((f) => (
            <li key={f.path} className="flex items-center gap-3 px-3 py-2 text-sm">
              {f.name.toLowerCase().endsWith(".pdf") ? (
                <FileText className="h-4 w-4 shrink-0 text-brand" />
              ) : (
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {f.status === "error" && <span className="text-xs text-destructive">Échec</span>}
              <button
                type="button"
                onClick={() => remove(f)}
                aria-label={`Retirer ${f.name}`}
                className="text-muted-foreground hover:text-destructive"
                disabled={f.status === "uploading"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
