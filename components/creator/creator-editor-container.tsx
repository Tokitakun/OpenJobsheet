"use client";

import { useSearchParams } from "next/navigation";
import { CreatorEditor } from "@/components/creator/creator-editor";

export function CreatorEditorContainer() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return <CreatorEditor initialId={id} />;
}
