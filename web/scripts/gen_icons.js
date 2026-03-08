import sharp from 'sharp';
import fs from 'fs';

async function generate() {
    const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#F6F8F6"/>
  <rect x="112" y="112" width="800" height="800" rx="300" ry="300" fill="#18181b"/>
  <path d="M 580 280 L 350 560 H 510 L 480 740 L 710 460 H 550 L 580 280 Z" fill="#FFFFFF"/>
</svg>`;

    const favIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="350 280 360 460">
  <path d="M 580 280 L 350 560 H 510 L 480 740 L 710 460 H 550 L 580 280 Z" fill="#18181b"/>
</svg>`;

    fs.writeFileSync('app-icon.svg', appIconSvg.trim());
    fs.writeFileSync('public/favicon.svg', favIconSvg.trim());

    // App icon for resources
    await sharp(Buffer.from(appIconSvg.trim()))
        .resize(1024, 1024)
        .png()
        .toFile('resources/icon.png');

    // Favicon png for public
    await sharp(Buffer.from(favIconSvg.trim()))
        .resize(512, 512)
        .png()
        .toFile('public/favicon.png');

    // PWA icons
    const sizes = [48, 72, 96, 128, 192, 256, 512];
    for (const size of sizes) {
        await sharp(Buffer.from(appIconSvg.trim()))
            .resize(size, size)
            .webp()
            .toFile(`icons/icon-${size}.webp`);
    }

    console.log('All icons generated successfully!');
}

generate().catch(console.error);
