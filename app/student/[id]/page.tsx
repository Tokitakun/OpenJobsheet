import { Suspense } from "react";
import { PREVIEW_FIXTURES } from "@/components/workspace/preview-fixtures";
import StudentJobsheetClientView from "./client-view";

export function generateStaticParams() {
  return PREVIEW_FIXTURES.map((f) => ({
    id: f.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentJobsheetPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-mono text-ink-muted">
          Memuat panduan praktikum...
        </div>
      }
    >
      <StudentJobsheetClientView jobsheetId={id} />
    </Suspense>
  );
}
