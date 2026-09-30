// Optional: convert original PNGs named by product ID from a supplied directory.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const source = process.argv[2];
if (!source) { console.error('Usage: node scripts/prepare-images.cjs <originals-directory>'); process.exit(1); }
fs.mkdirSync('public/images', { recursive: true });
(async () => { for (const id of ['brigadeirao','ninho','uva','morango','doce','abacaxi','prestigio','caramelo']) {
 await sharp(path.join(source,id+'.png')).resize(900,900,{fit:'inside'}).webp({quality:83}).toFile('public/images/'+id+'.webp');
} })().catch(error=>{console.error(error);process.exitCode=1;});

