const fs = require('fs');
const path = require('path');

const files = [
  'backend/controllers/videoController.js',
  'backend/routes/video.js',
  'backend/tests/setup.js',
  'backend/tests/auth.test.js',
  'backend/tests/video.test.js',
  'frontend/src/pages/VideoPlayerPage.jsx',
  'frontend/src/pages/UploadPage.jsx',
  'frontend/src/pages/DashboardPage.jsx',
];

const rootDir = 'd:\\F\\assisment';

function removeComments(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;

  while (i < code.length) {
    if (!inString && !inTemplate && (code[i] === '"' || code[i] === "'" || code[i] === '`')) {
      if (code[i] === '`') inTemplate = true;
      else { inString = true; stringChar = code[i]; }
      result += code[i]; i++; continue;
    }
    if (inString) {
      if (code[i] === '\\') { result += code[i] + (code[i + 1] || ''); i += 2; continue; }
      if (code[i] === stringChar) inString = false;
      result += code[i]; i++; continue;
    }
    if (inTemplate) {
      if (code[i] === '\\') { result += code[i] + (code[i + 1] || ''); i += 2; continue; }
      if (code[i] === '`') inTemplate = false;
      result += code[i]; i++; continue;
    }
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    result += code[i]; i++;
  }
  return result.replace(/\r/n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').replace(/^\n+/, '');
}

for (const f of files) {
  const p = path.join(rootDir, f.replace(/\//g, path.sep));
  if (fs.existsSync(p)) {
    const orig = fs.readFileSync(p, 'utf-8');
    fs.writeFileSync(p, removeComments(orig));
    console.log('CLEANED: ' + f);
  }
}
