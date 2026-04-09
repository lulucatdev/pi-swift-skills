import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

export function discoverSkills(skillsDir) {
  const skills = [];
  const entries = readdirSync(skillsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const name = entry.name;
    const dir = join(skillsDir, name);
    const skillFile = join(dir, 'SKILL.md');
    
    // Skip infrastructure directories
    if (['bin', 'node_modules', 'extensions', 'scripts', 'test', '.git', 'docs'].includes(name)) {
      continue;
    }
    
    try {
      statSync(skillFile);
      const content = readFileSync(skillFile, 'utf8');
      const descMatch = content.match(/^description:\s*(.+)$/m);
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      
      skills.push({
        name: nameMatch ? nameMatch[1].trim() : name,
        dir,
        skillFile,
        description: descMatch ? descMatch[1].trim() : ''
      });
    } catch {
      // No SKILL.md, skip
    }
  }
  
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseSkillMetadata(skillFile) {
  try {
    const content = readFileSync(skillFile, 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatter) return null;
    
    const meta = {};
    const lines = frontmatter[1].split('\n');
    
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        meta[match[1].trim()] = match[2].trim();
      }
    }
    
    return meta;
  } catch {
    return null;
  }
}
