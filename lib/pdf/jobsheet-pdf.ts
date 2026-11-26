/**
 * Client-side PDF Layout & Export Engine for OpenJobsheet
 * Uses jsPDF (100% client-side, local-first, zero server dependency).
 * Generates a deterministic A4 Portrait page model shared between
 * the PDF Preview UI and the downloaded .pdf file.
 */

import { jsPDF } from "jspdf";
import type {
  OpenJobsheetDocument,
  ContentBlock,
  CalloutVariant,
} from "@/lib/schema/document";
import { getMediaAssetsByDocumentId } from "@/lib/storage/jobsheet-repository";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_X_MM = 18;
export const MARGIN_TOP_MM = 18;
export const MARGIN_BOTTOM_MM = 20;
export const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_X_MM * 2; // 174mm
export const MAX_CONTENT_Y_MM = A4_HEIGHT_MM - MARGIN_BOTTOM_MM; // 277mm

export interface ResolvedPdfMedia {
  mediaId: string;
  dataUrl: string;
  format: "JPEG" | "PNG" | "WEBP";
  widthPx: number;
  heightPx: number;
}

export type PdfRenderItem =
  | {
      kind: "doc-header";
      code: string;
      category: string;
      durationMinutes: number;
      authorName: string;
      targetAudience: string;
      title: string;
      description: string;
      heightMm: number;
    }
  | {
      kind: "section-header";
      sectionNumber: number;
      title: string;
      description?: string;
      heightMm: number;
    }
  | {
      kind: "step-header";
      stepNumber: number;
      title: string;
      estimatedMinutes?: number;
      heightMm: number;
    }
  | {
      kind: "paragraph";
      lines: string[];
      heightMm: number;
    }
  | {
      kind: "heading";
      level: 1 | 2 | 3;
      lines: string[];
      heightMm: number;
    }
  | {
      kind: "callout";
      variant: CalloutVariant;
      title: string;
      lines: string[];
      heightMm: number;
    }
  | {
      kind: "checklist";
      title?: string;
      items: Array<{ text: string; required: boolean; lines: string[] }>;
      heightMm: number;
    }
  | {
      kind: "code";
      language: string;
      lines: string[];
      caption?: string;
      heightMm: number;
    }
  | {
      kind: "image";
      dataUrl?: string;
      format?: "JPEG" | "PNG" | "WEBP";
      altText: string;
      caption?: string;
      drawWidthMm: number;
      drawHeightMm: number;
      heightMm: number;
    }
  | {
      kind: "table";
      headers: string[];
      rows: string[][];
      caption?: string;
      heightMm: number;
    }
  | {
      kind: "video";
      title?: string;
      url: string;
      heightMm: number;
    };

export interface PdfPage {
  pageNumber: number;
  items: PdfRenderItem[];
}

export interface PdfDocumentLayout {
  documentTitle: string;
  pages: PdfPage[];
  totalPages: number;
}

/**
 * Sanitize jobsheet title (including Indonesian characters) into a safe .pdf filename.
 */
export function sanitizePdfFilename(title: string): string {
  const cleaned = (title || "jobsheet")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${cleaned || "jobsheet"}.pdf`;
}

/**
 * Resolve all local IndexedDB media blobs for a document into Data URLs + pixel dimensions.
 */
export async function resolveDocumentMediaForPdf(
  documentId: string
): Promise<Record<string, ResolvedPdfMedia>> {
  const assets = await getMediaAssetsByDocumentId(documentId);
  const resolved: Record<string, ResolvedPdfMedia> = {};

  await Promise.all(
    assets.map(
      (asset) =>
        new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            if (!dataUrl) {
              resolve();
              return;
            }
            const format: "JPEG" | "PNG" | "WEBP" =
              asset.mimeType === "image/png"
                ? "PNG"
                : asset.mimeType === "image/webp"
                ? "WEBP"
                : "JPEG";

            const img = new Image();
            img.onload = () => {
              resolved[asset.id] = {
                mediaId: asset.id,
                dataUrl,
                format,
                widthPx: img.naturalWidth || 800,
                heightPx: img.naturalHeight || 600,
              };
              resolve();
            };
            img.onerror = () => {
              resolved[asset.id] = {
                mediaId: asset.id,
                dataUrl,
                format,
                widthPx: 800,
                heightPx: 600,
              };
              resolve();
            };
            img.src = dataUrl;
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(asset.blob);
        })
    )
  );

  return resolved;
}

/**
 * Estimate wrapped text lines using jsPDF's font metrics so preview and export match.
 */
function wrapText(
  measurer: jsPDF,
  text: string,
  maxWidthMm: number,
  fontSizePt: number,
  fontName: "helvetica" | "courier" = "helvetica",
  fontStyle: "normal" | "bold" = "normal"
): string[] {
  if (!text) return [];
  measurer.setFont(fontName, fontStyle);
  measurer.setFontSize(fontSizePt);
  return measurer.splitTextToSize(text, maxWidthMm) as string[];
}

/**
 * Paginate an OpenJobsheetDocument into deterministic A4 portrait pages.
 */
export function buildJobsheetPdfLayout(
  doc: OpenJobsheetDocument,
  mediaMap: Record<string, ResolvedPdfMedia>
): PdfDocumentLayout {
  const measurer = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pages: PdfPage[] = [{ pageNumber: 1, items: [] }];
  let currentY = MARGIN_TOP_MM;

  const pushPage = () => {
    const nextNum = pages.length + 1;
    pages.push({ pageNumber: nextNum, items: [] });
    currentY = MARGIN_TOP_MM;
  };

  const addItem = (item: PdfRenderItem, minFollowSpaceMm = 0) => {
    const needed = item.heightMm + minFollowSpaceMm;
    const currentPage = pages[pages.length - 1];
    if (
      currentPage.items.length > 0 &&
      currentY + needed > MAX_CONTENT_Y_MM
    ) {
      pushPage();
    }
    pages[pages.length - 1].items.push(item);
    currentY += item.heightMm;
  };

  // 1. Document Header
  const titleLines = wrapText(
    measurer,
    doc.title || "Jobsheet Tanpa Judul",
    CONTENT_WIDTH_MM,
    18,
    "helvetica",
    "bold"
  );
  const descLines = doc.description
    ? wrapText(measurer, doc.description, CONTENT_WIDTH_MM, 10)
    : [];
  const docHeaderHeight =
    12 + titleLines.length * 7.5 + (descLines.length ? descLines.length * 4.8 + 4 : 0) + 8;

  addItem({
    kind: "doc-header",
    code: doc.code || "JOBSHEET",
    category: doc.category || "Umum",
    durationMinutes: doc.estimatedDurationMinutes || 60,
    authorName: doc.author?.name || "Instruktur",
    targetAudience: doc.targetAudience || "Siswa SMK / Praktikan",
    title: doc.title || "Jobsheet Tanpa Judul",
    description: doc.description || "",
    heightMm: docHeaderHeight,
  });

  // 2. Sections & Steps
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  sections.forEach((section, sIdx) => {
    const secTitleLines = wrapText(
      measurer,
      section.title || `Bagian ${sIdx + 1}`,
      CONTENT_WIDTH_MM,
      13,
      "helvetica",
      "bold"
    );
    const secDescLines = section.description
      ? wrapText(measurer, section.description, CONTENT_WIDTH_MM, 9.5)
      : [];
    const secHeight =
      7 + secTitleLines.length * 5.8 + (secDescLines.length ? secDescLines.length * 4.5 + 2 : 0) + 4;

    // Avoid orphaned section heading by requiring ~18mm for the first step
    addItem(
      {
        kind: "section-header",
        sectionNumber: sIdx + 1,
        title: section.title || `Bagian ${sIdx + 1}`,
        description: section.description,
        heightMm: secHeight,
      },
      18
    );

    const steps = Array.isArray(section.steps) ? section.steps : [];
    steps.forEach((step) => {
      const stepTitleLines = wrapText(
        measurer,
        `Langkah ${step.stepNumber}: ${step.title || "Langkah Kerja"}`,
        CONTENT_WIDTH_MM - 20,
        11,
        "helvetica",
        "bold"
      );
      const stepHeaderHeight = 4 + stepTitleLines.length * 5.2 + 3;

      addItem(
        {
          kind: "step-header",
          stepNumber: step.stepNumber,
          title: step.title || "Langkah Kerja",
          estimatedMinutes: step.estimatedMinutes,
          heightMm: stepHeaderHeight,
        },
        14
      );

      const blocks = Array.isArray(step.blocks) ? step.blocks : [];
      blocks.forEach((block) => {
        const item = measureBlock(measurer, block, mediaMap);
        if (item) {
          addItem(item);
        }
      });
    });
  });

  return {
    documentTitle: doc.title || "Jobsheet Tanpa Judul",
    pages,
    totalPages: pages.length,
  };
}

function measureBlock(
  measurer: jsPDF,
  block: ContentBlock,
  mediaMap: Record<string, ResolvedPdfMedia>
): PdfRenderItem | null {
  switch (block.type) {
    case "paragraph": {
      const lines = wrapText(measurer, block.content || "", CONTENT_WIDTH_MM, 10);
      if (lines.length === 0) return null;
      return {
        kind: "paragraph",
        lines,
        heightMm: lines.length * 4.8 + 3,
      };
    }

    case "heading": {
      const pt = block.level === 1 ? 13 : block.level === 2 ? 11.5 : 10.5;
      const lines = wrapText(measurer, block.text || "", CONTENT_WIDTH_MM, pt, "helvetica", "bold");
      if (lines.length === 0) return null;
      return {
        kind: "heading",
        level: block.level,
        lines,
        heightMm: lines.length * 5.5 + 3,
      };
    }

    case "callout": {
      const lines = wrapText(measurer, block.content || "", CONTENT_WIDTH_MM - 10, 9.5);
      const heightMm = 8 + lines.length * 4.6 + 5;
      return {
        kind: "callout",
        variant: block.variant,
        title: block.title || block.variant.toUpperCase(),
        lines,
        heightMm,
      };
    }

    case "checklist": {
      const items = (block.items || []).map((itm) => ({
        text: itm.text,
        required: itm.required,
        lines: wrapText(
          measurer,
          `${itm.text}${itm.required ? " *" : ""}`,
          CONTENT_WIDTH_MM - 10,
          9.5
        ),
      }));
      const totalLines = items.reduce((acc, it) => acc + Math.max(1, it.lines.length), 0);
      const heightMm = (block.title ? 7 : 3) + totalLines * 4.8 + 4;
      return {
        kind: "checklist",
        title: block.title,
        items,
        heightMm,
      };
    }

    case "code": {
      const rawLines = (block.code || "").split("\n");
      const wrapped: string[] = [];
      for (const l of rawLines) {
        const sub = wrapText(measurer, l || " ", CONTENT_WIDTH_MM - 8, 8.5, "courier", "normal");
        wrapped.push(...(sub.length ? sub : [" "]));
      }
      const heightMm = 8 + wrapped.length * 4 + (block.caption ? 5 : 0) + 4;
      return {
        kind: "code",
        language: block.language || "text",
        lines: wrapped,
        caption: block.caption,
        heightMm,
      };
    }

    case "image": {
      const media = block.mediaId ? mediaMap[block.mediaId] : undefined;
      if (media) {
        const maxW = CONTENT_WIDTH_MM;
        const maxH = 95;
        const ratio = media.widthPx / Math.max(1, media.heightPx);
        let drawW = maxW;
        let drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }
        return {
          kind: "image",
          dataUrl: media.dataUrl,
          format: media.format,
          altText: block.altText || "Gambar praktikum",
          caption: block.caption,
          drawWidthMm: drawW,
          drawHeightMm: drawH,
          heightMm: drawH + (block.caption ? 6 : 3) + 3,
        };
      }
      return {
        kind: "image",
        altText: block.altText || block.url || "Gambar",
        caption: block.caption,
        drawWidthMm: CONTENT_WIDTH_MM,
        drawHeightMm: 14,
        heightMm: 18,
      };
    }

    case "table": {
      const rowCount = (block.rows?.length || 0) + (block.headers?.length ? 1 : 0);
      return {
        kind: "table",
        headers: block.headers || [],
        rows: block.rows || [],
        caption: block.caption,
        heightMm: Math.max(12, rowCount * 7 + (block.caption ? 6 : 0) + 4),
      };
    }

    case "video":
      return {
        kind: "video",
        title: block.title,
        url: block.url,
        heightMm: 12,
      };

    default:
      return null;
  }
}

/**
 * Generate and download a real A4 PDF file using jsPDF from the exact paginated layout.
 */
export function exportJobsheetToPdf(
  doc: OpenJobsheetDocument,
  mediaMap: Record<string, ResolvedPdfMedia>
): PdfDocumentLayout {
  const layout = buildJobsheetPdfLayout(doc, mediaMap);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  layout.pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      pdf.addPage("a4", "portrait");
    }

    let y = MARGIN_TOP_MM;

    for (const item of page.items) {
      switch (item.kind) {
        case "doc-header": {
          // Meta line
          pdf.setFont("courier", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(40, 92, 77); // #285C4D
          pdf.text(
            `${item.code}  •  ${item.category}  •  ${item.durationMinutes} Menit  •  ${item.authorName}`,
            MARGIN_X_MM,
            y + 4
          );
          y += 8;

          // Title
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(18);
          pdf.setTextColor(32, 40, 36); // #202824
          const titleLines = pdf.splitTextToSize(item.title, CONTENT_WIDTH_MM) as string[];
          pdf.text(titleLines, MARGIN_X_MM, y + 4);
          y += titleLines.length * 7.5 + 2;

          // Description
          if (item.description) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(95, 107, 101); // #5F6B65
            const descLines = pdf.splitTextToSize(item.description, CONTENT_WIDTH_MM) as string[];
            pdf.text(descLines, MARGIN_X_MM, y + 3);
            y += descLines.length * 4.8 + 4;
          }

          // Divider
          pdf.setDrawColor(220, 226, 221); // #DCE2DD
          pdf.setLineWidth(0.4);
          pdf.line(MARGIN_X_MM, y, A4_WIDTH_MM - MARGIN_X_MM, y);
          y += 6;
          break;
        }

        case "section-header": {
          y += 2;
          pdf.setFont("courier", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(40, 92, 77);
          pdf.text(`BAGIAN ${item.sectionNumber}`, MARGIN_X_MM, y + 3);
          y += 5;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13);
          pdf.setTextColor(32, 40, 36);
          const sLines = pdf.splitTextToSize(item.title, CONTENT_WIDTH_MM) as string[];
          pdf.text(sLines, MARGIN_X_MM, y + 4);
          y += sLines.length * 5.8;

          if (item.description) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            pdf.setTextColor(95, 107, 101);
            const dLines = pdf.splitTextToSize(item.description, CONTENT_WIDTH_MM) as string[];
            pdf.text(dLines, MARGIN_X_MM, y + 3);
            y += dLines.length * 4.5 + 2;
          }
          y += 3;
          break;
        }

        case "step-header": {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(32, 40, 36);
          const stLines = pdf.splitTextToSize(
            `Langkah ${item.stepNumber}: ${item.title}`,
            CONTENT_WIDTH_MM - 22
          ) as string[];
          pdf.text(stLines, MARGIN_X_MM, y + 4);

          if (item.estimatedMinutes) {
            pdf.setFont("courier", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(100, 112, 106);
            pdf.text(
              `~${item.estimatedMinutes} mnt`,
              A4_WIDTH_MM - MARGIN_X_MM,
              y + 4,
              { align: "right" }
            );
          }
          y += stLines.length * 5.2 + 3;
          break;
        }

        case "paragraph": {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(32, 40, 36);
          pdf.text(item.lines, MARGIN_X_MM, y + 3.5);
          y += item.heightMm;
          break;
        }

        case "heading": {
          const pt = item.level === 1 ? 13 : item.level === 2 ? 11.5 : 10.5;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(pt);
          pdf.setTextColor(32, 40, 36);
          pdf.text(item.lines, MARGIN_X_MM, y + 4);
          y += item.heightMm;
          break;
        }

        case "callout": {
          const boxH = item.heightMm - 3;
          pdf.setFillColor(244, 246, 244);
          pdf.rect(MARGIN_X_MM, y, CONTENT_WIDTH_MM, boxH, "F");

          // Left accent border
          if (item.variant === "danger") pdf.setFillColor(180, 35, 24);
          else if (item.variant === "warning") pdf.setFillColor(163, 98, 26);
          else if (item.variant === "info") pdf.setFillColor(29, 93, 140);
          else pdf.setFillColor(40, 92, 77);
          pdf.rect(MARGIN_X_MM, y, 1.5, boxH, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(32, 40, 36);
          pdf.text(item.title, MARGIN_X_MM + 4, y + 5);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.setTextColor(55, 65, 60);
          pdf.text(item.lines, MARGIN_X_MM + 4, y + 10);
          y += item.heightMm;
          break;
        }

        case "checklist": {
          if (item.title) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(40, 92, 77);
            pdf.text(item.title, MARGIN_X_MM, y + 4);
            y += 6;
          }
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.setTextColor(32, 40, 36);
          for (const chk of item.items) {
            pdf.setDrawColor(130, 140, 134);
            pdf.rect(MARGIN_X_MM + 1, y + 1, 3.2, 3.2);
            pdf.text(chk.lines, MARGIN_X_MM + 7, y + 3.6);
            y += Math.max(1, chk.lines.length) * 4.8;
          }
          y += 3;
          break;
        }

        case "code": {
          const boxH = item.heightMm - 3;
          pdf.setFillColor(237, 241, 237);
          pdf.rect(MARGIN_X_MM, y, CONTENT_WIDTH_MM, boxH, "F");
          pdf.setFont("courier", "bold");
          pdf.setFontSize(7.5);
          pdf.setTextColor(95, 107, 101);
          pdf.text(item.language.toUpperCase(), MARGIN_X_MM + 3, y + 4);

          pdf.setFont("courier", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(32, 40, 36);
          pdf.text(item.lines, MARGIN_X_MM + 3, y + 8.5);
          y += item.heightMm;
          break;
        }

        case "image": {
          if (item.dataUrl && item.format) {
            const xOffset = MARGIN_X_MM + (CONTENT_WIDTH_MM - item.drawWidthMm) / 2;
            const imgFmt = item.format === "WEBP" ? "PNG" : item.format;
            try {
              pdf.addImage(
                item.dataUrl,
                imgFmt,
                xOffset,
                y + 1,
                item.drawWidthMm,
                item.drawHeightMm
              );
            } catch {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(9);
              pdf.text(`[Gambar: ${item.altText}]`, MARGIN_X_MM, y + 6);
            }
            y += item.drawHeightMm + 3;
            if (item.caption) {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(8.5);
              pdf.setTextColor(95, 107, 101);
              pdf.text(item.caption, A4_WIDTH_MM / 2, y + 2, { align: "center" });
              y += 5;
            }
            y += 2;
          } else {
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(9);
            pdf.setTextColor(95, 107, 101);
            pdf.text(`[Gambar: ${item.altText}]`, MARGIN_X_MM, y + 6);
            y += item.heightMm;
          }
          break;
        }

        case "table": {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(32, 40, 36);
          if (item.headers.length > 0) {
            pdf.text(item.headers.join("  |  "), MARGIN_X_MM, y + 4);
            y += 6;
          }
          pdf.setFont("helvetica", "normal");
          for (const row of item.rows) {
            pdf.text(row.join("  |  "), MARGIN_X_MM, y + 4);
            y += 5.5;
          }
          y += 3;
          break;
        }

        case "video": {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9);
          pdf.setTextColor(95, 107, 101);
          pdf.text(`[Video: ${item.title || item.url}]`, MARGIN_X_MM, y + 5);
          y += item.heightMm;
          break;
        }
      }
    }

    // Page Footer
    pdf.setDrawColor(220, 226, 221);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_X_MM, A4_HEIGHT_MM - 14, A4_WIDTH_MM - MARGIN_X_MM, A4_HEIGHT_MM - 14);

    pdf.setFont("courier", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 112, 106);
    pdf.text("OpenJobsheet", MARGIN_X_MM, A4_HEIGHT_MM - 9);
    pdf.text(
      `Halaman ${page.pageNumber} dari ${layout.totalPages}`,
      A4_WIDTH_MM - MARGIN_X_MM,
      A4_HEIGHT_MM - 9,
      { align: "right" }
    );
  });

  const filename = sanitizePdfFilename(doc.title);
  pdf.save(filename);
  return layout;
}
