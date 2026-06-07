function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\t/g, "    ")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapPdfLine(line: string, maxChars: number) {
  const compact = line.trim();
  if (!compact) {
    return [""];
  }

  const chunks: string[] = [];
  let remaining = compact;

  while (remaining.length > maxChars) {
    const splitAt = remaining.lastIndexOf(" ", maxChars);
    const index = splitAt > 0 ? splitAt : maxChars;
    chunks.push(remaining.slice(0, index).trimEnd());
    remaining = remaining.slice(index).trimStart();
  }

  chunks.push(remaining);
  return chunks;
}

export function buildSimplePdfBufferFromText(content: string) {
  const maxCharsPerLine = 95;
  const maxLinesPerPage = 48;
  const normalizedContent = (content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .flatMap((line) => wrapPdfLine(sanitizePdfText(line), maxCharsPerLine));
  const finalLines = normalizedContent.length > 0 ? normalizedContent : ["No content"];

  const pages: string[][] = [];
  for (let index = 0; index < finalLines.length; index += maxLinesPerPage) {
    pages.push(finalLines.slice(index, index + maxLinesPerPage));
  }

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = addObject("");
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    const pageContent = [
      "BT",
      "/F1 10 Tf",
      "50 800 Td",
      "14 TL",
      ...pageLines.map((line, lineIndex) => (lineIndex === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
      "ET",
    ].join("\n");
    const contentStream = `<< /Length ${Buffer.byteLength(pageContent, "ascii")} >>\nstream\n${pageContent}\nendstream`;
    const contentId = addObject(contentStream);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((pageId) => `${pageId} 0 R`).join(" ")}] >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "ascii");
}
