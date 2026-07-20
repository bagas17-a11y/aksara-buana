const { default: pdfParse } = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('Mind Map & SOP Kurir.pdf');
pdfParse(buf).then(d => process.stdout.write(d.text)).catch(console.error);
