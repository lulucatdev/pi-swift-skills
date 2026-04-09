import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { discoverSkills, parseSkillMetadata } from './skill-index.js';

export function materializeSkills(skillsDir, outputDir, settings) {
  const skills = discoverSkills(skillsDir);
  const index = {};
  
  mkdirSync(outputDir, { recursive: true });
  
  for (const skill of skills) {
    const meta = parseSkillMetadata(skill.skillFile);
    const isDisabled = settings.disabledSkills.includes(skill.name);
    const autoTrigger = isDisabled ? true : (settings.triggerMode === 'auto');
    
    const destDir = join(outputDir, skill.name);
    mkdirSync(destDir, { recursive: true });
    
    // Process SKILL.md
    let skillContent = readFileSync(skill.skillFile, 'utf8');
    
    // Inject disable flag if disabled
    if (isDisabled) {
      skillContent = skillContent.replace(
        /^---\n([\s\S]*?)\n---/,
        (match, frontmatter) => {
          return `---\n${frontmatter}\ndisable-model-invocation: true\n---`;
        }
      );
    }
    
    writeFileSync(join(destDir, 'SKILL.md'), skillContent);
    
    // Mirror support files
    mirrorSupportFiles(skill.dir, destDir);
    
    index[skill.name] = {
      autoTrigger,
      skillFile: join(destDir, 'SKILL.md'),
      description: meta?.description || ''
    };
  }
  
  // Write skill index
  writeFileSync(
    join(outputDir, 'skill-index.json'),
    JSON.stringify(index, null, 2)
  );
  
  return { skills, index };
}

function mirrorSupportFiles(sourceDir, destDir) {
  const entries = readdirSync(sourceDir, { withFileTypes: true, recursive: true });
  
  for (const entry of entries) {
    if (entry.name === 'SKILL.md') continue;
    
    const srcPath = join(entry.parentPath || sourceDir, entry.name);
    const relPath = srcPath.replace(sourceDir, '').replace(/^\//, '');
    const destPath = join(destDir, relPath);
    
    try {
      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
      } else {
        mkdirSync(dirname(destPath), { recursive: true });
        cpSync(srcPath, destPath, { preserveTimestamps: true });
      }
    } catch (e) {
      console.error(`Failed to copy ${srcPath}:`, e.message);
    }
  }
}
