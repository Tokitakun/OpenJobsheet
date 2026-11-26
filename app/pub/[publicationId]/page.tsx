import { Suspense } from "react";
import PublishedJobsheetClient from "./published-client";

interface PageProps {
  params: Promise<{ publicationId: string }>;
}

async function PublishedJobsheetResolver({ params }: PageProps) {
  const { publicationId } = await params;
  return <PublishedJobsheetClient publicationId={publicationId} />;
}

export default function PublishedJobsheetPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 bg-canvas text-ink font-mono text-sm">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Memuat publikasi...</span>
          </div>
        </div>
      }
    >
      <PublishedJobsheetResolver params={params} />
    </Suspense>
  );
}
