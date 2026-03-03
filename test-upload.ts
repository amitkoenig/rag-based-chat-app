import fs from 'fs';
import path from 'path';

async function testUpload() {
  const formData = new FormData();
  const fileContent = fs.readFileSync('test.pdf');
  const blob = new Blob([fileContent], { type: 'application/pdf' });
  formData.append('files', blob, 'test.pdf');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}

testUpload();
