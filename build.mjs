// Builds dist/: the pages in site/ and the fonts they load, copied from the npm packages so the site loads nothing
// from another host.
import fs from 'fs';
import path from 'path';

const ROOT = import.meta.dirname;
const DIST = path.join(ROOT, 'dist');
const VENDOR = path.join(DIST, 'vendor');

// Latin and Latin Extended, the subsets the books load
const FONTS = [
  { family: 'Fraunces', name: '@fontsource-variable/fraunces', css: 'opsz.css', files: /^fraunces-latin(-ext)?-opsz-normal$/ },
  { family: 'Public Sans', name: '@fontsource-variable/public-sans', css: 'index.css', files: /^public-sans-latin(-ext)?-wght-normal$/ },
];

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'site'), DIST, { recursive: true });

const rules = [];
for (const font of FONTS) {
  const dir = path.join(ROOT, 'node_modules', font.name);
  if (!fs.existsSync(dir)) throw new Error(`${font.name} is missing from node_modules, run npm install`);
  const to = path.basename(font.name);
  fs.mkdirSync(path.join(VENDOR, to), { recursive: true });
  // fontsource opens each @font-face rule with a comment naming its file
  for (const block of fs.readFileSync(path.join(dir, font.css), 'utf8').split('/* ').slice(1)) {
    const id = block.slice(0, block.indexOf(' */'));
    if (!font.files.test(id)) continue;
    fs.copyFileSync(path.join(dir, 'files', `${id}.woff2`), path.join(VENDOR, to, `${id}.woff2`));
    rules.push(block.slice(block.indexOf('@font-face')).trim()
      .replace(/font-family: '[^']*'/, `font-family: '${font.family}'`)
      .replace(/url\(\.\/files\//, `url(${to}/`));
  }
  fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(VENDOR, to, 'LICENSE'));
}
if (rules.length !== 4) throw new Error(`expected 4 font files, found ${rules.length}: the fontsource file names changed`);
fs.writeFileSync(path.join(VENDOR, 'fonts.css'), rules.join('\n') + '\n');
console.log(`built ${path.relative(ROOT, DIST)}/`);
