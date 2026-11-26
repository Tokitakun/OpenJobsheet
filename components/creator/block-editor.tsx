"use client";

import * as React from "react";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  ShieldAlert,
  Info,
  Lightbulb,
  Code2,
  CheckSquare,
  Plus,
  Upload,
  Link as LinkIcon,
  X,
} from "lucide-react";
import {
  ContentBlock,
  CalloutVariant,
  ChecklistItem,
  generateId,
} from "@/lib/schema/document";
import { Button } from "@/components/ui/button";
import {
  saveMediaAsset,
  deleteMediaAsset,
} from "@/lib/storage/jobsheet-repository";
import { LocalImageRenderer } from "@/components/shared/local-image-renderer";

interface BlockEditorProps {
  documentId: string;
  block: ContentBlock;
  onUpdate: (updatedBlock: ContentBlock) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function BlockEditor({
  documentId,
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type: JPEG, PNG, WebP
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Format gambar tidak didukung. Harap gunakan JPEG, PNG, atau WebP.");
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("Ukuran gambar melebihi 5MB. Harap gunakan gambar yang lebih kecil.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      if (block.type === "image" && block.mediaId) {
        // Clean up previous media asset if being replaced
        await deleteMediaAsset(block.mediaId).catch(() => {});
      }

      const mediaRecord = await saveMediaAsset(documentId, file, file.name);
      if (block.type === "image") {
        onUpdate({
          ...block,
          mediaId: mediaRecord.id,
          altText: block.altText || file.name.replace(/\.[^/.]+$/, ""),
        });
      }
    } catch (err) {
      setUploadError("Gagal menyimpan gambar ke penyimpanan lokal IndexedDB: " + err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveMedia = async () => {
    if (block.type === "image" && block.mediaId) {
      await deleteMediaAsset(block.mediaId).catch(() => {});
      onUpdate({
        ...block,
        mediaId: undefined,
      });
    }
  };
  return (
    <div className="group rounded-md border border-line bg-canvas/35 p-4 transition-colors hover:border-line-strong focus-within:border-primary/50 space-y-3">
      {/* Block Header Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-line text-xs font-mono text-ink-secondary">
        <div className="flex items-center gap-2">
          <span className="uppercase font-semibold text-primary">
            {block.type}
          </span>
          {block.type === "heading" && <span>(H{block.level})</span>}
          {block.type === "callout" && (
            <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-muted text-ink-secondary">
              {block.variant}
            </span>
          )}
          {block.type === "code" && (
            <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-muted text-ink-secondary">
              {block.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Pindahkan blok ke atas"
              aria-label="Pindahkan blok ke atas"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              title="Pindahkan blok ke bawah"
              aria-label="Pindahkan blok ke bawah"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            title="Hapus blok"
            aria-label="Hapus blok"
            className="h-8 w-8 inline-flex items-center justify-center rounded text-danger hover:bg-danger/10 cursor-pointer ml-0.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Block Content Editor per BlockType */}
      {block.type === "paragraph" && (
        <div>
          <textarea
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Tuliskan petunjuk atau penjelasan praktikum di sini..."
            rows={3}
            className="w-full text-sm text-ink bg-transparent border-0 focus:ring-0 p-0 resize-y leading-relaxed placeholder:text-ink-muted"
          />
        </div>
      )}

      {block.type === "heading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() =>
                  onUpdate({ ...block, level: lvl as 1 | 2 | 3 })
                }
                className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                  block.level === lvl
                    ? "bg-primary text-primary-fg"
                    : "bg-muted text-ink-secondary hover:bg-muted/80"
                }`}
              >
                H{lvl}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={block.text}
            onChange={(e) => onUpdate({ ...block, text: e.target.value })}
            placeholder="Judul sub-bagian..."
            className={`w-full font-bold text-ink bg-transparent border-0 focus:ring-0 p-0 ${
              block.level === 1
                ? "text-lg"
                : block.level === 2
                ? "text-base"
                : "text-sm"
            }`}
          />
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1">
            {(["warning", "danger", "info", "tip"] as CalloutVariant[]).map(
              (v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdate({ ...block, variant: v })}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                    block.variant === v
                      ? v === "danger"
                        ? "bg-danger text-white"
                        : v === "warning"
                        ? "bg-amber text-white"
                        : v === "info"
                        ? "bg-info text-white"
                        : "bg-primary text-primary-fg"
                      : "bg-muted text-ink-secondary hover:text-ink"
                  }`}
                >
                  {v === "danger" && <ShieldAlert className="h-3 w-3" />}
                  {v === "warning" && <AlertTriangle className="h-3 w-3" />}
                  {v === "info" && <Info className="h-3 w-3" />}
                  {v === "tip" && <Lightbulb className="h-3 w-3" />}
                  <span>{v}</span>
                </button>
              )
            )}
          </div>
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder="Judul Callout (opsional, misal: Peringatan Bahaya Listrik)"
            className="w-full text-xs font-semibold text-ink bg-muted/30 border border-line rounded px-2.5 py-1.5 focus:border-primary"
          />
          <textarea
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Isi pesan peringatan atau informasi penting..."
            rows={2}
            className="w-full text-xs text-ink bg-muted/30 border border-line rounded p-2.5 focus:border-primary resize-y"
          />
        </div>
      )}

      {block.type === "code" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-ink-muted" />
              <select
                value={block.language}
                onChange={(e) =>
                  onUpdate({ ...block, language: e.target.value })
                }
                className="text-xs font-mono bg-muted border border-line rounded px-2 py-1 text-ink"
              >
                <option value="bash">Bash / Terminal</option>
                <option value="python">Python</option>
                <option value="cpp">C / C++ (Arduino)</option>
                <option value="json">JSON</option>
                <option value="html">HTML</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-ink-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={block.showLineNumbers}
                onChange={(e) =>
                  onUpdate({ ...block, showLineNumbers: e.target.checked })
                }
                className="h-3.5 w-3.5 rounded accent-primary"
              />
              <span>Nomor Baris</span>
            </label>
          </div>
          <textarea
            value={block.code}
            onChange={(e) => onUpdate({ ...block, code: e.target.value })}
            placeholder="Tulis atau tempel potongan kode / perintah di sini..."
            rows={4}
            className="w-full font-mono text-xs text-ink bg-muted/60 border border-line rounded p-3 focus:border-primary resize-y leading-normal"
          />
        </div>
      )}

      {block.type === "checklist" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder="Judul Checklist (misal: Daftar Verifikasi Komponen)"
            className="w-full text-xs font-semibold text-ink bg-transparent border-b border-line pb-1 focus:border-primary"
          />
          <div className="space-y-2">
            {block.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded border border-line/60"
              >
                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[idx] = { ...item, text: e.target.value };
                    onUpdate({ ...block, items: newItems });
                  }}
                  placeholder="Deskripsi tugas atau hal yang harus diverifikasi..."
                  className="flex-1 bg-transparent text-xs text-ink focus:outline-none"
                />
                <label className="flex items-center gap-1 text-[11px] font-mono text-ink-muted cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) => {
                      const newItems = [...block.items];
                      newItems[idx] = { ...item, required: e.target.checked };
                      onUpdate({ ...block, items: newItems });
                    }}
                    className="h-3 w-3 accent-primary"
                  />
                  <span>Wajib</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newItems = block.items.filter((i) => i.id !== item.id);
                    onUpdate({ ...block, items: newItems });
                  }}
                  className="text-danger/70 hover:text-danger p-0.5 cursor-pointer ml-1"
                  title="Hapus item checklist"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newItem: ChecklistItem = {
                id: generateId(),
                text: "",
                required: true,
              };
              onUpdate({
                ...block,
                items: [...block.items, newItem],
              });
            }}
          >
            <Plus className="h-3 w-3" />
            <span>Tambah Item Checklist</span>
          </Button>
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-3">
          {/* Preview of current media/image */}
          {(block.mediaId || block.url) && (
            <div className="relative group/img">
              <LocalImageRenderer
                mediaId={block.mediaId}
                url={block.url}
                altText={block.altText}
                caption={block.caption}
              />
              <div className="flex justify-end gap-2 mt-1">
                {block.mediaId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveMedia}
                    className="text-danger hover:text-danger hover:bg-danger/10 text-xs py-1 h-7"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    <span>Hapus Gambar Lokal</span>
                  </Button>
                )}
                {block.url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate({ ...block, url: undefined })}
                    className="text-danger hover:text-danger hover:bg-danger/10 text-xs py-1 h-7"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    <span>Hapus URL Gambar</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Import local device image */}
          <div className="rounded-md border border-dashed border-line bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Unggah Gambar dari Perangkat (Lokal Offline)</span>
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                JPEG, PNG, WebP (Maks. 5MB)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="text-xs text-ink-secondary file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-fg hover:file:opacity-90 cursor-pointer"
              />
              {isUploading && (
                <span className="text-xs font-mono text-primary animate-pulse">
                  Menyimpan ke IndexedDB...
                </span>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-danger font-medium">{uploadError}</p>
            )}
          </div>

          {/* Alternative URL Fallback */}
          <div className="space-y-1 pt-1 border-t border-line/60">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Atau gunakan Tautan URL Gambar Eksternal</span>
            </div>
            <input
              type="text"
              value={block.url || ""}
              onChange={(e) => onUpdate({ ...block, url: e.target.value })}
              placeholder="https://example.com/diagram-rangkaian.png"
              className="w-full text-xs text-ink bg-muted/40 border border-line rounded px-2.5 py-1.5 focus:border-primary"
            />
          </div>

          {/* Image Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <input
              type="text"
              value={block.altText || ""}
              onChange={(e) => onUpdate({ ...block, altText: e.target.value })}
              placeholder="Teks Alt (deskripsi gambar untuk aksesibilitas)..."
              className="w-full text-xs text-ink-secondary bg-muted/40 border border-line rounded px-2.5 py-1.5 focus:border-primary"
            />
            <input
              type="text"
              value={block.caption || ""}
              onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
              placeholder="Keterangan gambar (caption bawah)..."
              className="w-full text-xs text-ink-secondary bg-muted/40 border border-line rounded px-2.5 py-1.5 focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
