// imageUtils.js
// Centralized image utilities for the project
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Load an image as a PNG buffer, optionally resizing.
 * @param {string} filePath - Path to the image file.
 * @param {object} [resize] - { width, height } to resize.
 * @returns {Promise<Buffer>}
 */
async function loadImage(filePath, resize) {
  let img = sharp(filePath).png();
  if (resize && (resize.width || resize.height)) {
    img = img.resize(resize.width, resize.height, { fit: 'contain' });
  }
  return img.toBuffer();
}

/**
 * Generate a PNG buffer from SVG string.
 * @param {string} svg - SVG markup.
 * @param {object} [resize] - { width, height } to resize.
 * @returns {Promise<Buffer>}
 */
async function svgToPng(svg, resize) {
  let img = sharp(Buffer.from(svg)).png();
  if (resize && (resize.width || resize.height)) {
    img = img.resize(resize.width, resize.height, { fit: 'contain' });
  }
  return img.toBuffer();
}

/**
 * Composite multiple images onto a base image, preserving quality.
 * @param {string|Buffer} base - Path or buffer for base image.
 * @param {Array<{input: string|Buffer, left: number, top: number}>} overlays
 * @returns {Promise<Buffer>}
 */
async function compositeImages(base, overlays) {
  let baseImg = typeof base === 'string' ? sharp(base).png() : sharp(base).png();
  return baseImg.composite(overlays).png().toBuffer();
}

// Asset type paths for easy reference
const ASSET_PATHS = {
  metrics: './Assets/Metrics',
  roles: './Assets/Roles',
  helms: './Assets/Helms',
  pets: './Assets/Pets/transformed',
  canvas: './Assets/Canvas',
};

/**
 * General asset loader with resizing and lossless PNG output
 * @param {string} type - Asset type (metrics, roles, helms, pets, canvas)
 * @param {string} file - Filename
 * @param {object} size - { width, height }
 * @returns {Promise<Buffer>}
 */
async function loadAsset(type, file, size) {
  if (!file) throw new Error(`Missing file for asset type: ${type}`);
  return sharp(path.join(ASSET_PATHS[type], file))
    .resize(size.width, size.height, { fit: 'contain' })
    .ensureAlpha()
    .png({ quality: 100, compressionLevel: 0 })
    .toBuffer();
}

/**
 * SVG text generator for overlays (improved for vertical/horizontal alignment)
 * @param {object} opts - { text, width, height, fontSize, x, y, anchor, weight, fill, fontFamily }
 * @returns {Promise<Buffer>}
 */
async function svgText({ text, width, height, fontSize = 32, x = '50%', y = '50%', anchor = 'middle', weight = 'bold', fill = 'black', fontFamily = 'Arial' }) {
  // Center text vertically by default
  const dy = fontSize / 3;
  const svg = `<svg width="${width}" height="${height}"><text x="${x}" y="${y}" dy="${dy}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${text}</text></svg>`;
  return sharp(Buffer.from(svg))
    .ensureAlpha()
    .png({ quality: 100, compressionLevel: 0 })
    .toBuffer();
}

/**
 * Composite images on a base canvas, lossless
 * @param {string|Buffer} basePath - Path or buffer for base image
 * @param {Array<{input: string|Buffer, left: number, top: number}>} layers
 * @param {string} outputPath - Output file path
 */
async function compositeImage(basePath, outputPath) {
  const base = sharp(basePath).ensureAlpha();
  await base.png({ quality: 100, compressionLevel: 0 }).toFile(outputPath);
}

// compositeImage(`${ASSET_PATHS.metrics}/doom_of_mokhaiotl.webp`, `${ASSET_PATHS.metrics}/doom_of_mokhaiotl.png`)

module.exports = {
  loadImage,
  svgToPng,
  compositeImages,
  loadAsset,
  svgText,
  compositeImage,
  ASSET_PATHS,
};
