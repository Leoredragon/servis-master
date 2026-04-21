const fs = require('fs');

const files = [
  'app/gelir-gider/page.tsx',
  'app/cek-senet/page.tsx',
  'app/taksit-takip/page.tsx'
];

files.forEach(file => {
  console.log(`\n--- ${file} ---`);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const nonAscii = content.match(/[^\x00-\x7F]/g);
    if (nonAscii) {
      const unique = [...new Set(nonAscii)];
      unique.forEach(char => {
        console.log(`${char} : ${char.charCodeAt(0).toString(16)}`);
      });
      
      // Print context for some warped ones
      const warped = content.match(/.{0,20}[^\x00-\x7F]{1,}.{0,20}/g);
      console.log('\nContext specimens:');
      warped?.slice(0, 10).forEach(c => console.log(c));
    } else {
      console.log('No non-ASCII characters found.');
    }
  } catch (err) {
    console.error(`Error reading ${file}: ${err.message}`);
  }
});
