"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, RotateCw, Trash2, UploadCloud } from "lucide-react";
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
  error?: string;
}

const EXT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Android renvoie parfois un type vide (ou image/jpg) : on se rabat sur l'extension.
function typeOf(file: File) {
  if (ATTACHMENT_RULES.accept[file.type]) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPES[ext] ?? file.type;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // Copie en mémoire de chaque fichier lu, pour pouvoir réessayer sans le rechoisir.
  const blobs = useRef(new Map<string, Blob>());

  async function send(path: string, blob: Blob, name: string) {
    const supabase = createClient();
    onChange((prev) => prev.map((f) => (f.path === path ? { ...f, status: "uploading", error: undefined } : f)));
    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { error } = await supabase.storage.from("devis").upload(path, blob, {
          contentType: blob.type,
          upsert: false,
        });
        // « Existe déjà » : une tentative précédente est en fait arrivée au serveur.
        if (!error || /already exists|duplicate/i.test(error.message)) {
          onChange((prev) => prev.map((f) => (f.path === path ? { ...f, status: "done", error: undefined } : f)));
          blobs.current.delete(path);
          return;
        }
        lastError = error.message;
        // Erreur de droits ou de format : inutile de réessayer.
        if (/row-level|mime|size|exceeded|unauthorized|jwt/i.test(error.message)) break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
      if (attempt < 3) await sleep(attempt * 1500);
    }
    const message = /fetch|network|load failed|timeout/i.test(lastError)
      ? "Connexion interrompue"
      : "Échec";
    onChange((prev) => prev.map((f) => (f.path === path ? { ...f, status: "error", error: message } : f)));
    toast.error(`${name} : le téléversement a échoué. Touchez « Réessayer ».`);
  }

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    let running = total;
    let count = files.length;

    for (const file of Array.from(list)) {
      const type = typeOf(file);
      if (count >= ATTACHMENT_RULES.maxFiles) {
        toast.error(`${ATTACHMENT_RULES.maxFiles} fichiers maximum.`);
        break;
      }
      if (!ATTACHMENT_RULES.accept[type]) {
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

      const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
      onChange((prev) => [...prev, { path, name: file.name, size: file.size, status: "uploading" }]);

      // On lit le fichier tout de suite : sur Android, une image choisie dans la galerie
      // ou Google Photos peut devenir illisible au moment de l'envoi.
      let blob: Blob;
      try {
        const buffer = await file.arrayBuffer();
        blob = new Blob([buffer], { type });
      } catch {
        onChange((prev) =>
          prev.map((f) => (f.path === path ? { ...f, status: "error", error: "Fichier illisible" } : f)),
        );
        toast.error(
          `${file.name} : impossible de lire ce fichier. Enregistrez-le d'abord sur le téléphone (Téléchargements), puis choisissez-le depuis « Fichiers ».`,
        );
        continue;
      }
      running += file.size;
      count += 1;
      blobs.current.set(path, blob);
      await send(path, blob, file.name);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function retry(file: UploadedFile) {
    const blob = blobs.current.get(file.path);
    if (!blob) {
      toast.error("Retirez ce fichier puis ajoutez-le à nouveau.");
      return;
    }
    await send(file.path, blob, file.name);
  }

  async function remove(file: UploadedFile) {
    blobs.current.delete(file.path);
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
              {f.status === "error" && (
                <>
                  <span className="shrink-0 text-xs text-destructive">{f.error ?? "Échec"}</span>
                  {blobs.current.has(f.path) && (
                    <button
                      type="button"
                      onClick={() => retry(f)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <RotateCw className="h-3 w-3" />
                      Réessayer
                    </button>
                  )}
                </>
              )}
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
