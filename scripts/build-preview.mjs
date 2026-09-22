import { cp, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, '_site');
await mkdir(output, { recursive: true });
if ((await readdir(output)).length) throw new Error('The output directory must be empty before packaging.');
for (const file of ['index.html', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest', '.nojekyll', 'app', 'assets']) {
  await cp(join(root, file), join(output, file), { recursive: true });
}
console.log('Public preview packaged in _site; no repository metadata, tests or development scripts included.');
