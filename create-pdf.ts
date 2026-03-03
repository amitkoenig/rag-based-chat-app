import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText('Hello world! This is a test PDF document for indexing.');
  const bytes = await doc.save();
  fs.writeFileSync('test.pdf', bytes);
}
run();
