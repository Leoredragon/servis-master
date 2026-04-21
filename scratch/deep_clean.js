const fs = require('fs');

const files = [
  'app/gelir-gider/page.tsx',
  'app/cek-senet/page.tsx',
  'app/taksit-takip/page.tsx'
];

files.forEach(file => {
  console.log(`Deep cleaning ${file}...`);
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the specific problematic byte sequences found via hex analysis
    // BA + Ş(u015e) + (u009e) + LANGIÇ
    content = content.replace(/\u015E\u009E/g, 'Ş');
    content = content.replace(/\u015F\u009E/g, 'ş');
    
    // Also handle potentially double encoded arrows if they exist
    content = content.replace(/\u00E2\u2020\u2018/g, '↑');
    content = content.replace(/\u00E2\u2020\u2013/g, '↓');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Done.`);
  } catch (err) {
    console.error(err.message);
  }
});
