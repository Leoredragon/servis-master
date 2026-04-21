const fs = require('fs');

const files = [
  'app/gelir-gider/page.tsx',
  'app/cek-senet/page.tsx',
  'app/taksit-takip/page.tsx'
];

const replacements = [
  // Double/Triple warped
  ['İÅž', 'İŞ'],
  ['Ã…Âž', 'Ş'],
  ['Ã…Å¸', 'ş'],
  ['Ã„Â±', 'ı'],
  ['Ãƒâ€¡', 'Ç'],
  ['Ã„Â°', 'İ'],
  ['Åžž', 'Ş'],
  ['şž', 'ş'],
  
  // Single warped
  ['Ã¶', 'ö'], ['Ã¼', 'ü'], ['Ã§', 'ç'], ['Ã–', 'Ö'], ['Ãœ', 'Ü'], ['Ã‡', 'Ç'],
  ['ÅŸ', 'ş'], ['Åž', 'Ş'], ['Ä°', 'İ'], ['Ä±', 'ı'], ['ÄŸ', 'ğ'], ['Äž', 'Ğ'],
  
  // Symbols
  ['â†‘', '↑'], ['â†“', '↓'], ['â‚º', '₺'], ['â€”', '—'],
  ['Ã¢â€šÂº', '₺'], ['Ã¢â‚¬â€”', '—'],
  ['Ã¢â€€œ', '↓'], ['Ã¢â€€', '↑'],
  ['ğŸ’°', '💰'], ['ğŸ“Š', '📊']
];

files.forEach(file => {
  console.log(`Final sweep: ${file}`);
  try {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    replacements.forEach(([warped, clean]) => {
      if (content.includes(warped)) {
        content = content.split(warped).join(clean);
        changed = true;
      }
    });
    
    // Also catch any raw \u00c5\u009e if they exist as separate characters
    if (content.includes('\u00c5\u009e')) {
       content = content.replace(/\u00c5\u009e/g, 'Ş');
       changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`  Updated.`);
    } else {
      console.log(`  Clean.`);
    }
  } catch (err) {
    console.error(err.message);
  }
});
