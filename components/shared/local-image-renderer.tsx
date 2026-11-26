"use client";

import * as React from "react";
import { getMediaAsset } from "@/lib/storage/jobsheet-repository";
import { ImageIcon } from "lucide-react";

interface LocalImageRendererProps {
  mediaId?: string;
  url?: string;
  altText: string;
  caption?: string;
  className?: string;
}

/**
 * Robust image renderer supporting both direct URLs and local IndexedDB Blobs.
 * Automatically manages createObjectURL and revokeObjectURL to avoid memory leaks.
 */
export function LocalImageRenderer({
  mediaId,
  url,
  altText,
  caption,
  className = "",
}: LocalImageRendererProps) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(mediaId && !url));
  const [error, setError] = React.useState<boolean>(false);

  React.useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (mediaId) {
      Promise.resolve().then(() => {
        if (!active) return;
        setLoading(true);
        setError(false);
      });

      getMediaAsset(mediaId)
        .then((asset) => {
          if (!active) return;
          if (asset && asset.blob) {
            createdUrl = URL.createObjectURL(asset.blob);
            setBlobUrl(createdUrl);
          } else {
            // Media ID not found or no blob
            setError(true);
          }
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (!active) return;
        setBlobUrl(null);
        setLoading(false);
      });
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [mediaId]);

  const displaySrc = blobUrl || url;

  if (loading) {
    return (
      <div className="rounded-md border border-line bg-muted/30 p-8 text-center text-xs font-mono text-ink-muted animate-pulse flex items-center justify-center gap-2">
        <ImageIcon className="h-4 w-4 animate-spin" />
        <span>Memuat gambar media lokal...</span>
      </div>
    );
  }

  if (error && !url) {
    return (
      <div className="rounded-md border border-dashed border-danger/40 bg-danger/5 p-6 text-center text-xs text-danger flex items-center justify-center gap-2">
        <ImageIcon className="h-4 w-4" />
        <span>Gambar lokal tidak ditemukan ({altText || mediaId})</span>
      </div>
    );
  }

  if (!displaySrc) {
    return (
      <div className="rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
        <ImageIcon className="h-4 w-4" />
        <span>Gambar ({altText || "Tanpa URL/Media"})</span>
      </div>
    );
  }

  return (
    <figure className="space-y-1.5 pt-1 my-2">
      <div className="rounded-md border border-line bg-surface/50 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displaySrc}
          alt={altText || "Ilustrasi Praktikum"}
          className={`max-h-96 w-auto object-contain mx-auto rounded ${className}`}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs font-mono text-ink-muted italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
