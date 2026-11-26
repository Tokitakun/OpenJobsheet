"use client";

import * as React from "react";

interface PublishedImageRendererProps {
  publicationId: string;
  mediaId: string;
  shareToken: string;
  altText: string;
  caption?: string;
  fallbackUrl?: string;
}

/**
 * Renders images from the Publishing API endpoint.
 * Used in Student Mode for published (remote) jobsheets.
 */
export function PublishedImageRenderer({
  publicationId,
  mediaId,
  shareToken,
  altText,
  caption,
  fallbackUrl,
}: PublishedImageRendererProps) {
  const [error, setError] = React.useState(false);

  const src = mediaId
    ? `/api/publish/${publicationId}/media/${mediaId}?token=${encodeURIComponent(shareToken)}`
    : fallbackUrl || "";

  if (!src) {
    return (
      <div className="rounded-md bg-muted/40 border border-line p-4 text-xs text-ink-muted text-center font-mono">
        Gambar tidak tersedia
      </div>
    );
  }

  if (error && fallbackUrl) {
    return (
      <figure className="space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackUrl}
          alt={altText}
          className="rounded-md border border-line max-w-full"
        />
        {caption && (
          <figcaption className="text-[11px] text-ink-muted font-mono text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-muted/40 border border-line p-4 text-xs text-ink-muted text-center font-mono">
        Gagal memuat gambar
      </div>
    );
  }

  return (
    <figure className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={altText}
        className="rounded-md border border-line max-w-full"
        onError={() => setError(true)}
      />
      {caption && (
        <figcaption className="text-[11px] text-ink-muted font-mono text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
