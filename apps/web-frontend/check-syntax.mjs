import fs from 'fs';
import path from 'path';

const filePath = 'app/(main)/upload/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inMultiLineComment = false;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j - 1] : '';
    const nextChar = j < line.length - 1 ? line[j + 1] : '';
    
    // Skip comments
    if (char === '/' && nextChar === '/' && !inString && !inMultiLineComment) {
      break; // Skip rest of line
    }
    
    if (char === '/' && nextChar === '*' && !inString) {
      inMultiLineComment = true;
      j++;
      continue;
    }
    
    if (char === '*' && nextChar === '/' && inMultiLineComment) {
      inMultiLineComment = false;
      j++;
      continue;
    }
    
    if (inMultiLineComment) continue;
    
    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    
    if (inString) continue;
    
    // Count braces
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    
    if (openBraces < 0 || openParens < 0 || openBrackets < 0) {
      console.log(`Line ${i + 1}: Mismatched closing bracket`);
      console.log(`  Braces: ${openBraces}, Parens: ${openParens}, Brackets: ${openBrackets}`);
      console.log(`  ${line}`);
    }
  }
  
  // Check around line 298
  if (i >= 295 && i <= 305) {
    console.log(`Line ${i + 1} (braces: ${openBraces}, parens: ${openParens}): ${line.substring(0, 80)}`);
  }
}

console.log('\n=== Final counts ===');
console.log(`Open Braces: ${openBraces}`);
console.log(`Open Parens: ${openParens}`);
console.log(`Open Brackets: ${openBrackets}`);
