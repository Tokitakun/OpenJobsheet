import { Suspense } from "react";
import { PdfPreviewClient } from "@/components/creator/pdf-preview-client";

export default function CreatorPdfPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#DFE3DF] text-ink font-mono text-sm">
          <span>Memuat pratinjau PDF...</span>
        </div>
      }
    >
      <PdfPreviewClient />
    </Suspense>
  );
}
