const fs = require('fs');

const file = 'app/gelir-gider/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Manual fixes for the remaining warped strings in gelir-gider
content = content.replace('BAŞžLANGIÇ', 'BAŞLANGIÇ');
content = content.replace('BİTİÃ…Âž', 'BİTİŞ');
content = content.replace('BİTİŞž', 'BİTİŞ');

fs.writeFileSync(file, content, 'utf8');
console.log('Final manual fixes applied to gelir-gider/page.tsx');
