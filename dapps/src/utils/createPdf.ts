import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default async function createPDF(
  id: number,
  nullifier: string,
  secret: string
) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const title = "Your ZK Commitment Keys";
  const content = [`id: ${id}`, `Nullifier: ${nullifier}`, `Secret: ${secret}`];

  // Configuration
  const fontSizeTitle = 24;
  const fontSizeContent = 12;
  const maxWidth = 550;
  const lineHeight = 20;
  let currentY = 750;

  // Draw the title
  page.drawText(title, {
    x: 50,
    y: currentY,
    size: fontSizeTitle,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 40;

  // Draw the content
  content.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: currentY - index * 30, // Position each line below the previous one
      size: fontSizeContent,
      lineHeight,
      maxWidth,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Create a Blob and download it
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}
