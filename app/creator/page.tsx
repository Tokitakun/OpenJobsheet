import { Suspense } from "react";
import { CreatorEditorContainer } from "@/components/creator/creator-editor-container";

export default function CreatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 bg-canvas text-ink font-mono text-sm">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Memuat Creator Mode...</span>
          </div>
        </div>
      }
    >
      <CreatorEditorContainer />
    </Suspense>
  );
}
