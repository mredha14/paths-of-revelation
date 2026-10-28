import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspace = path.resolve('.');
const output = path.resolve('dist-hostinger');
if (!output.startsWith(`${workspace}${path.sep}`)) {
  throw new Error(`Refusing to replace output outside the workspace: ${output}`);
}

const standalone = path.join(workspace, '.next', 'standalone');
const serverFile = path.join(standalone, 'server.js');
await readFile(serverFile);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(standalone, output, { recursive: true });
await mkdir(path.join(output, '.next'), { recursive: true });
await cp(path.join(workspace, '.next', 'static'), path.join(output, '.next', 'static'), { recursive: true });
await cp(path.join(workspace, 'public'), path.join(output, 'public'), { recursive: true });
await mkdir(path.join(output, 'data'), { recursive: true });
await cp(path.join(workspace, 'data', 'seed.json'), path.join(output, 'data', 'seed.json'));
await mkdir(path.join(output, 'data', 'uploads'), { recursive: true });
await cp(path.join(workspace, 'data', 'seed-assets'), path.join(output, 'data', 'uploads'), { recursive: true });
await cp(path.join(workspace, 'data', 'uploads'), path.join(output, 'data', 'uploads'), {
  recursive: true,
  force: false,
  errorOnExist: false,
});

const packageJson = JSON.parse(await readFile(path.join(workspace, 'package.json'), 'utf8'));
await writeFile(path.join(output, 'package.json'), JSON.stringify({
  name: packageJson.name,
  version: packageJson.version,
  private: true,
  type: 'module',
  engines: packageJson.engines,
  dependencies: packageJson.dependencies,
  scripts: {
    build: 'npm install --omit=dev',
    start: 'node server.js',
  },
}, null, 2));

console.log(`Hostinger application prepared in ${output}`);
