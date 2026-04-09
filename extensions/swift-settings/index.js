import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { loadSettings, saveSettings } from './config.js';
import { createRuntimeBundle, getCurrentPaths } from './runtime-bundle.js';

let piCodingAgent, piTui;

// ESM import fallback for pi runtime packages
async function loadPiPackages() {
  try {
    [piCodingAgent, piTui] = await Promise.all([
      import('@mariozechner/pi-coding-agent'),
      import('@mariozechner/pi-tui'),
    ]);
  } catch {
    if (!process.argv[1]) throw new Error('Not running inside pi');
    try {
      const piReal = realpathSync(process.argv[1]);
      const piPkgDir = resolve(dirname(piReal), '..');
      const toURL = (f) => pathToFileURL(f).href;
      [piCodingAgent, piTui] = await Promise.all([
        import(toURL(join(piPkgDir, 'dist', 'index.js'))),
        import(toURL(join(piPkgDir, 'node_modules', '@mariozechner', 'pi-tui', 'dist', 'index.js'))),
      ]);
    } catch (e) {
      throw new Error(`Failed to load pi runtime packages: ${e.message}`);
    }
  }
}

function packageRootPath() {
  // Find the package root from the extension's location
  const extDir = dirname(new URL(import.meta.url).pathname);
  return resolve(extDir, '..', '..');
}

export default async function register(pi) {
  await loadPiPackages();
  
  const pkgRoot = packageRootPath();
  
  // Set environment variable for skill files to reference
  process.env.SWIFT_PKG_ROOT = pkgRoot;
  
  // Register settings command
  pi.registerCommand('/swift-settings', {
    description: 'Configure Swift skills trigger mode and enable/disable individual skills',
    handler: async () => {
      const settings = loadSettings();
      
      // Create TUI for settings
      const form = {
        triggerMode: {
          type: 'select',
          label: 'Trigger Mode',
          options: [
            { value: 'manual', label: 'Manual (default to disabled, use /skill:name to invoke)' },
            { value: 'auto', label: 'Auto (skills enabled by default)' }
          ],
          value: settings.triggerMode
        }
      };
      
      // Could add individual skill toggles here
      
      const result = await piTui.form(form);
      if (result) {
        settings.triggerMode = result.triggerMode;
        saveSettings(settings);
        
        // Rebuild runtime bundle with new settings
        createRuntimeBundle(pkgRoot, settings);
        
        return `Swift settings updated. Trigger mode: ${result.triggerMode}`;
      }
    }
  });
  
  // Hook into resource discovery
  pi.hooks.register('resources_discover', async () => {
    const settings = loadSettings();
    const bundle = createRuntimeBundle(pkgRoot, settings);
    
    return {
      skillPaths: bundle.skillPaths,
      promptPaths: bundle.promptPaths
    };
  });
}
