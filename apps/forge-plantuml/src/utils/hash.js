const { createHash } = require('crypto');

function generateAttachmentHash(source, format, theme) {
  const content = `${source}|${format}|${theme || 'default'}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function generateAttachmentName(hash, format) {
  return `plantuml-${hash}.${format}`;
}

function clampDimensions(width, height) {
  const result = {};
  
  if (width) {
    const w = parseInt(width, 10);
    if (!isNaN(w) && w > 0) {
      result.width = Math.min(w, 2000); // Max 2000px
    }
  }
  
  if (height) {
    const h = parseInt(height, 10);
    if (!isNaN(h) && h > 0) {
      result.height = Math.min(h, 2000); // Max 2000px
    }
  }
  
  return result;
}

module.exports = { generateAttachmentHash, generateAttachmentName, clampDimensions };