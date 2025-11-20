const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Find all route.ts files
const files = findRouteFiles('src/app/api');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`✓ ${file} - already has dynamic export`);
    return;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    console.log(`✗ ${file} - no imports found`);
    return;
  }

  // Insert after last import (with blank line)
  let insertIndex = lastImportIndex + 1;

  // Skip empty lines after imports
  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex++;
  }

  // Insert the export statement
  lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic'", '');

  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log(`✓ ${file} - added dynamic export`);
});

console.log('\nDone! Updated all API routes.');
