import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, '../data/products.json');

/**
 * Searches and parses product catalog.
 * @param {string} tag 
 * @returns {Array} List of processed products with parsed metadata
 */
export function getProductsByTag(tag) {
  const fileData = fs.readFileSync(productsFilePath, 'utf8');
  const products = JSON.parse(fileData);

  const filtered = tag 
    ? products.filter(p => p.tags.includes(tag.toLowerCase()))
    : products;

  // BUG LOCATION:
  // Assumes all products contain valid JSON string in `rawMetadata`.
  // Product `p202` contains malformed JSON string without quotes,
  // causing JSON.parse to throw: SyntaxError: Unexpected token...
  return filtered.map(product => {
    const parsedMeta = JSON.parse(product.rawMetadata);
    
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      tags: product.tags,
      metadata: parsedMeta
    };
  });
}
