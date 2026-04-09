import { mkdirSync, rmSync, symlinkSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { materializeSkills } from './materialize-skills.js';
import { materializePrompts } from './materialize-prompts.js';

const CACHE_TTL_MS = 60000; // 60 seconds

export function createRuntimeBundle(packageRoot, settings) {
  const skillsDir = join(packageRoot, 'skills');
  const cacheBase = join(process.env.HOME, '.pi', 'agent', 'cache', 'swift');
  
  // Generate unique build ID
  const ts = Date.now();
  const hex = randomBytes(4).toString('hex');
  const buildId = `build-${ts}-${hex}`;
  
  const buildDir = join(cacheBase, buildId);
  const skillsOutput = join(buildDir, 'skills');
  const promptsOutput = join(buildDir, 'prompts');
  
  // Materialize skills and prompts
  const { index } = materializeSkills(skillsDir, skillsOutput, settings);
  materializePrompts(index, promptsOutput, settings);
  
  // Atomic symlink swap
  const currentLink = join(cacheBase, 'current');
  const nextLink = join(cacheBase, `current.next-${hex}`);
  
  try {
    symlinkSync(buildDir, nextLink);
    
    // Rename to current (atomic on POSIX)
    try {
      rmSync(currentLink, { recursive: true });
    } catch {}
    
    // On macOS/Linux, we can rename a symlink atomically
    // On Windows, this may not be atomic but it's the best we can do
    const { renameSync } = await import('node:fs');
    renameSync(nextLink, currentLink);
  } catch (e) {
    console.error('Failed to swap runtime bundle:', e.message);
    throw e;
  }
  
  // Prune old builds
  pruneStaleBuilds(cacheBase, buildId);
  
  return {
    buildId,
    skillPaths: skillsOutput,
    promptPaths: promptsOutput,
    currentLink
  };
}

function pruneStaleBuilds(cacheBase, currentBuildId) {
  try {
    const entries = readdirSync(cacheBase);
    const now = Date.now();
    
    for (const entry of entries) {
      if (entry === 'current') continue;
      if (entry === currentBuildId) continue;
      
      // Parse timestamp from build ID
      const match = entry.match(/build-(\d+)-/);
      if (match) {
        const ts = parseInt(match[1], 10);
        if (now - ts > CACHE_TTL_MS) {
          try {
            rmSync(join(cacheBase, entry), { recursive: true });
          } catch {}
        }
      }
    }
  } catch {}
}

export function getCurrentPaths() {
  const cacheBase = join(process.env.HOME, '.pi', 'agent', 'cache', 'swift');
  const currentLink = join(cacheBase, 'current');
  
  try {
    const realPath = realpathSync(currentLink);
    return {
      skillPaths: join(realPath, 'skills'),
      promptPaths: join(realPath, 'prompts')
    };
  } catch {
    return null;
  }
}

import { realpathSync } from 'node:fs';
