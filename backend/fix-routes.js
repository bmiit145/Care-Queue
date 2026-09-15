const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');

let files = [];
try {
  const output = execSync('dir /s /b src\\modules\\*.routes.ts').toString();
  files = output.split('\r\n').filter(Boolean);
} catch (e) {}

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('const router = express.Router();')) {
     if (!content.includes('Router')) {
        content = content.replace(/(import .* from 'express';)/, "import { Router } from 'express';\n$1");
     } else if (!content.includes('{ Router }') && !content.match(/import .*Router.* from 'express'/)) {
        content = content.replace(/import (.*) from 'express';/, "import $1, { Router } from 'express';");
     }
     content = content.replace('const router = express.Router();', 'const router: import("express").Router = express.Router();');
  } else if (content.includes('const router = Router();')) {
     content = content.replace('const router = Router();', 'const router: Router = Router();');
  }
  
  fs.writeFileSync(file, content);
});

let serverContent = fs.readFileSync('src/server.ts', 'utf8');
serverContent = serverContent.replace('const app = express();', 'const app: express.Application = express();');
fs.writeFileSync('src/server.ts', serverContent);

console.log('Fixed router and app typings.');
