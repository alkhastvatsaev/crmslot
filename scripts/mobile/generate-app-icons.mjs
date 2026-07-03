#!/usr/bin/env node
/**
 * Generate native + PWA app icons from public/pwa/icon-*.svg sources.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const ANDROID_LAUNCHER_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const ANDROID_ADAPTIVE_FOREGROUND_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const NATIVE_VARIANTS = {
  admin: {
    svg: "icon-admin.svg",
    backgroundColor: "#FFFFFF",
    foreground: "admin",
  },
  technician: {
    svg: "icon-technician.svg",
    backgroundColor: "#09090B",
    foreground: "technician",
  },
};

const PWA_VARIANTS = ["admin", "inbox", "technician", "demande"];

function lockForegroundSvg(variant) {
  if (variant === "admin") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="adminLockGradFg" x1="256" y1="128" x2="256" y2="406" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E7E5E4"/>
      <stop offset="38%" stop-color="#A8A29E"/>
      <stop offset="72%" stop-color="#78716C"/>
      <stop offset="100%" stop-color="#57534E"/>
    </linearGradient>
    <filter id="adminLockShadowFg" x="-25%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#78716C" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g transform="translate(256,272) scale(0.58) translate(-256,-272)" filter="url(#adminLockShadowFg)" fill="url(#adminLockGradFg)">
    <circle cx="256" cy="214" r="86"/>
    <rect x="204" y="228" width="104" height="178" rx="52"/>
  </g>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="techLockGradFg" x1="256" y1="128" x2="256" y2="406" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="42%" stop-color="#F5F5F4"/>
      <stop offset="100%" stop-color="#D4D4D8"/>
    </linearGradient>
    <filter id="techLockShadowFg" x="-25%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.42"/>
    </filter>
  </defs>
  <g transform="translate(256,272) scale(0.58) translate(-256,-272)" filter="url(#techLockShadowFg)" fill="url(#techLockGradFg)">
    <circle cx="256" cy="214" r="86"/>
    <rect x="204" y="228" width="104" height="178" rx="52"/>
  </g>
</svg>`;
}

function adaptiveIconXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
}

function backgroundColorXml(color) {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${color}</color>
</resources>`;
}

async function renderSvg(svgContent, size) {
  const supersample = size * 2;
  return sharp(Buffer.from(svgContent))
    .resize(supersample, supersample, { kernel: sharp.kernel.lanczos3 })
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function renderSvgFile(svgPath, size) {
  const supersample = size * 2;
  return sharp(svgPath)
    .resize(supersample, supersample, { kernel: sharp.kernel.lanczos3 })
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function writePng(filePath, buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png().toFile(filePath);
}

async function generatePwaIcons() {
  console.log("→ PWA icons");
  for (const variant of PWA_VARIANTS) {
    const svgPath = path.join(ROOT, "public/pwa", `icon-${variant}.svg`);
    if (!fs.existsSync(svgPath)) continue;
    for (const size of [192, 512]) {
      const out = path.join(ROOT, "public/pwa", `icon-${variant}-${size}.png`);
      await writePng(out, await renderSvgFile(svgPath, size));
      console.log(`  ✓ ${path.relative(ROOT, out)}`);
    }
    const maskableOut = path.join(ROOT, "public/pwa", `icon-${variant}-maskable-512.png`);
    await writePng(maskableOut, await renderSvgFile(svgPath, 512));
    console.log(`  ✓ ${path.relative(ROOT, maskableOut)}`);
  }
}

async function generateAndroidFlavor(flavor, config) {
  console.log(`→ Android flavor: ${flavor}`);
  const flavorRes = path.join(ROOT, "android/app/src", flavor, "res");
  const svgPath = path.join(ROOT, "public/pwa", config.svg);
  const foregroundSvg = lockForegroundSvg(config.foreground);

  fs.mkdirSync(path.join(flavorRes, "values"), { recursive: true });
  fs.mkdirSync(path.join(flavorRes, "mipmap-anydpi-v26"), { recursive: true });
  fs.writeFileSync(path.join(flavorRes, "values/ic_launcher_background.xml"), backgroundColorXml(config.backgroundColor));
  fs.writeFileSync(path.join(flavorRes, "mipmap-anydpi-v26/ic_launcher.xml"), adaptiveIconXml());
  fs.writeFileSync(path.join(flavorRes, "mipmap-anydpi-v26/ic_launcher_round.xml"), adaptiveIconXml());

  for (const [density, size] of Object.entries(ANDROID_LAUNCHER_SIZES)) {
    const dir = path.join(flavorRes, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const fullIcon = await renderSvgFile(svgPath, size);
    await writePng(path.join(dir, "ic_launcher.png"), fullIcon);
    await writePng(path.join(dir, "ic_launcher_round.png"), fullIcon);
  }

  for (const [density, size] of Object.entries(ANDROID_ADAPTIVE_FOREGROUND_SIZES)) {
    const dir = path.join(flavorRes, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    await writePng(path.join(dir, "ic_launcher_foreground.png"), await renderSvg(foregroundSvg, size));
  }

  console.log(`  ✓ ${path.relative(ROOT, flavorRes)}`);
}

async function generateIosIcon(variant) {
  console.log(`→ iOS AppIcon (${variant})`);
  const config = NATIVE_VARIANTS[variant] ?? NATIVE_VARIANTS.admin;
  const svgPath = path.join(ROOT, "public/pwa", config.svg);
  const out = path.join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
  await writePng(out, await renderSvgFile(svgPath, 1024));
  console.log(`  ✓ ${path.relative(ROOT, out)}`);
}

async function updateResourcesIcon() {
  const adminSvg = path.join(ROOT, "public/pwa/icon-admin.svg");
  const out = path.join(ROOT, "resources/icon-only.png");
  await writePng(out, await renderSvgFile(adminSvg, 512));
  console.log(`  ✓ ${path.relative(ROOT, out)}`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const iosOnly = args.has("--ios-only");
  const variant = process.env.NATIVE_ICON_VARIANT?.trim() || "admin";

  if (!iosOnly) {
    await generatePwaIcons();
    for (const [flavor, config] of Object.entries(NATIVE_VARIANTS)) {
      await generateAndroidFlavor(flavor, config);
    }
    await updateResourcesIcon();
  }

  await generateIosIcon(NATIVE_VARIANTS[variant] ? variant : "admin");
  console.log("\nDone. Rebuild APK/IPA to see changes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
