// src/init.ts
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Injeção Global
(global as any).require = require;
(global as any).__dirname = __dirname;
(global as any).__filename = __filename;

console.log('✅ Camada de compatibilidade injetada.');