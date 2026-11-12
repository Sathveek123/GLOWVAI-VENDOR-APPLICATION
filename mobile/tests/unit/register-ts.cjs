// Lets the unit tests import the app's TypeScript modules without a bundler: each .ts file is transpiled to CommonJS
// with the project's own TypeScript compiler when Node loads it. Used by `npm run test:unit`.
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const ts = require('typescript');

registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = fs.readFileSync(new URL(url), 'utf8');
      const out = ts.transpileModule(source, {
        fileName: url,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      });
      return { format: 'commonjs', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
