const fs = require('fs');

const files = [
  'app/gelir-gider/page.tsx',
  'app/stok/page.tsx',
  'app/stok/yeni/page.tsx',
  'app/stok/[id]/page.tsx',
  'app/components/StokHareketiModal.tsx',
  'app/taksit-takip/page.tsx',
  'app/cek-senet/page.tsx'
];

const replacements = [
  // Triple warped sequences
  ['Ã¢â€ â€˜', '↑'],
  ['Ã¢â€ â€œ', '↓'],
  ['Ã¢â‚¬â€”', '—'],
  ['â†³', '↳'],

  // Double warped
  ['Ã¢â€€œ', '↓'], ['Ã¢â€€', '↑'], ['Ã¢â€šÂº', '₺'],
  ['Ãƒâ€¡', 'Ç'], ['ÃƒÂ§', 'ç'], ['Ã„Â±', 'ı'], ['Ã„Â°', 'İ'], ['Ã…Âž', 'Ş'], ['Ã…Å¸', 'ş'], ['Ã„Å¸', 'ğ'], ['Ã„Å¾', 'Ğ'],

  // Standard warped
  ['Ã¶', 'ö'], ['Ã¼', 'ü'], ['Ã§', 'ç'], ['Ã–', 'Ö'], ['Ãœ', 'Ü'], ['Ã‡', 'Ç'],
  ['ÅŸ', 'ş'], ['Åž', 'Ş'], ['Ä°', 'İ'], ['Ä±', 'ı'], ['ÄŸ', 'ğ'], ['Äž', 'Ğ'],
  ['â‚º', '₺'], ['â€”', '—'], ['â†‘', '↑'], ['â†“', '↓']
];

files.forEach(file => {
  console.log(`Processing ${file}...`);
  try {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    replacements.forEach(([warped, clean]) => {
      if (content.includes(warped)) {
        content = content.split(warped).join(clean);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`  Updated ${file}.`);
    } else {
      console.log(`  Clean.`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
});
