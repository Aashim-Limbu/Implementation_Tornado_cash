import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export default async function createPDF(nullifier: string, secret: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const title = "Your ZK Commitment Keys";
  const content = [`nullifier: ${nullifier}`, `secret:${secret}`];

  page.drawText(title)
}
