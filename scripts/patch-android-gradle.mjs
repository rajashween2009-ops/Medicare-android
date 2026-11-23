import fs from 'node:fs';
import path from 'node:path';

const targetRoot = process.argv[2] || 'android';
const candidates = [
  path.join(targetRoot, 'build.gradle'),
  path.join(targetRoot, 'app', 'build.gradle')
];

const block = `
configurations.all {
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk7'
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
}
`;

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("module: 'kotlin-stdlib-jdk7'")) {
    content += '\n' + block;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched Kotlin stdlib exclusions in', file);
  }
}
