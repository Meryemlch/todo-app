const fs = require('fs');
const path = require('path');

const lcovPath = path.join(__dirname, 'coverage', 'lcov.info');

if (fs.existsSync(lcovPath)) {
  let content = fs.readFileSync(lcovPath, 'utf8');
  
  // Remplacer tous les backslashes par des slashes
  content = content.replace(/\\/g, '/');
  
  fs.writeFileSync(lcovPath, content, 'utf8');
  console.log('lcov.info paths normalized (Windows → Unix)');
} else {
  console.error('lcov.info not found');
}