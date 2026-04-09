import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function generatePromptShim(skillName, skillInfo, outputDir) {
  const promptFile = join(outputDir, `${skillName}.md`);
  
  // If skill is disabled, show disabled notice
  if (skillInfo.disabled) {
    const content = `# ${skillName}

> **Currently Disabled**
> 
> This skill is disabled in your settings. Enable it with "/swift-settings" to use it.
> 
> Direct invocation via "/skill:${skillName}" still works when disabled.
`;
    writeFileSync(promptFile, content);
    return;
  }
  
  // Normal prompt shim
  const content = `# ${skillName}

Use /skill:${skillName} to load this Swift skill.

Description: ${skillInfo.description || 'Swift development skill'}
`;
  writeFileSync(promptFile, content);
}

export function materializePrompts(index, outputDir, settings) {
  mkdirSync(outputDir, { recursive: true });
  
  for (const [name, info] of Object.entries(index)) {
    const isDisabled = settings.disabledSkills.includes(name);
    generatePromptShim(name, { ...info, disabled: isDisabled }, outputDir);
  }
}
