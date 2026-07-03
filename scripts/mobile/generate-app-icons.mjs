#!/usr/bin/env node
/**
 * Generate native + PWA app icons from public/pwa/icon-*.svg sources.
 *
 * Fixes Android adaptive icon "too big" issue by splitting foreground (glyph only,
 * safe-zone padded) from background (solid color per variant).
 *
 * Usage:
 *   node scripts/mobile/generate-app-icons.mjs
 *   NATIVE_ICON_VARIANT=admin node scripts/mobile/generate-app-icons.mjs --ios-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const ANDROID_DENSITIES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

/** Native Android flavors → SVG source + adaptive background color */
const NATIVE_VARIANTS = {
  admin: {
    svg: "icon-admin.svg",
    backgroundColor: "#FFFFFF",
    lockColor: "#09090B",
  },
  technician: {
    svg: "icon-technician.svg",
    backgroundColor: "#09090B",
    lockColor: "#F5F5F4",
  },
};

/** PWA variants → SVG source file */
const PWA_VARIANTS = [
  "admin",
  "inbox",
  "technician",
  "demande",
];

function lockForegroundSvg(lockColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <g transform="translate(256,272) scale(0.56) translate(-256,-272)" fill="${lockColor}">
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
  return sharp(Buffer.from(svgContent)).resize(size, size).png().toBuffer();
}

async function renderSvgFile(svgPath, size) {
  return sharp(svgPath).resize(size, size).png().toBuffer();
}

async function writePng(filePath, buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png().toFile(filePath);
}

async function generatePwaIcons() {
  console.log("→ PWA icons");
  for (const variant of PWA_VARIANTS) {
    const svgPath = path.join(ROOT, "public/pwa", `icon-${variant}.svg`);
    if (!fs.existsSync(svgPath)) {
      console.warn(`  skip ${variant}: ${svgPath} missing`);
      continue;
    }
    for (const size of [192, 512]) {
      const out = path.join(ROOT, "public/pwa", `icon-${variant}-${size}.png`);
      const buf = await renderSvgFile(svgPath, size);
      await writePng(out, buf);
      console.log(`  ✓ ${path.relative(ROOT, out)}`);
    }
    const maskableOut = path.join(ROOT, "public/pwa", `icon-${variant}-maskable-512.png`);
    const maskableSvg = await fs.promises.readFile(svgPath, "utf8");
    const padded = maskableSvg.replace(
      'viewBox="0 0 512 512"',
      'viewBox="0 0 512 512"',
    );
    const buf = await renderSvg(padded, 512);
    await writePng(maskableOut, buf);
    console.log(`  ✓ ${path.relative(ROOT, maskableOut)}`);
  }
}

async function generateAndroidFlavor(flavor, config) {
  console.log(`→ Android flavor: ${flavor}`);
  const flavorRes = path.join(ROOT, "android/app/src", flavor, "res");
  const svgPath = path.join(ROOT, "public/pwa", config.svg);

  fs.mkdirSync(path.join(flavorRes, "values"), { recursive: true });
  fs.mkdirSync(path.join(flavorRes, "mipmap-anydpi-v26"), { recursive: true });

  fs.writeFileSync(
    path.join(flavorRes, "values/ic_launcher_background.xml"),
    backgroundColorXml(config.backgroundColor),
  );
  fs.writeFileSync(
    path.join(flavorRes, "mipmap-anydpi-v26/ic_launcher.xml"),
    adaptiveIconXml(),
  );
  fs.writeFileSync(
    path.join(flavorRes, "mipmap-anydpi-v26/ic_launcher_round.xml"),
    adaptiveIconXml(),
  );

  const foregroundSvg = lockForegroundSvg(config.lockColor);

  for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
    const dir = path.join(flavorRes, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });

    const fullIcon = await renderSvgFile(svgPath, size);
    const foreground = await renderSvg(foregroundSvg, size);

    await writePng(path.join(dir, "ic_launcher.png"), fullIcon);
    await writePng(path.join(dir, "ic_launcher_round.png"), fullIcon);
    await writePng(path.join(dir, "ic_launcher_foreground.png"), foreground);
  }

  console.log(`  ✓ ${path.relative(ROOT, flavorRes)}`);
}

async function generateIosIcon(variant) {
  console.log(`→ iOS AppIcon (${variant})`);
  const config = NATIVE_VARIANTS[variant] ?? NATIVE_VARIANTS.admin;
  const svgPath = path.join(ROOT, "public/pwa", config.svg);
  const out = path.join(
    ROOT,
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
  );
  const buf = await renderSvgFile(svgPath, 1024);
  await writePng(out, buf);
  console.log(`  ✓ ${path.relative(ROOT, out)}`);
}

async function updateResourcesIcon() {
  const adminSvg = path.join(ROOT, "public/pwa/icon-admin.svg");
  const out = path.join(ROOT, "resources/icon-only.png");
  const buf = await renderSvgFile(adminSvg, 512);
  await writePng(out, buf);
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

  await generateIosIcon(
    NATIVE_VARIANTS[variant] ? variant : "admin",
  );

  console.log("\nDone. Rebuild APK/IPA to see changes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
