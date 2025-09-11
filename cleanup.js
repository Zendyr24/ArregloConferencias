const fs = require('fs');
const path = require('path');

// Files and directories to keep
const KEEP_FILES = [
  'index.html',
  'style.css',
  'scripts/',
  'pages/',
  'assets/'
];

// Files to delete
const FILES_TO_DELETE = [
  'arreglo-mes.html',
  'bosquejos.html',
  'coordinadores.html',
  'participantes.html',
  'script.js',
  '_header.html',
  '_footer.html',
  '_sidebar.html'
];

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
  console.log('Created assets directory');
}

// Delete unnecessary files
FILES_TO_DELETE.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
    console.log(`Deleted: ${file}`);
  }
});

console.log('\nCleanup completed!');
console.log('Project structure is now organized.');
console.log('Main pages are in the /pages directory.');
console.log('Assets should be placed in the /assets directory.');
