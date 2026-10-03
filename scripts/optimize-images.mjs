import sharp from 'sharp';
for(const name of ['nova-studio','nova-air','nova-arc']){await sharp(`public/images/${name}.png`).webp({quality:88}).toFile(`public/images/${name}.webp`);}
