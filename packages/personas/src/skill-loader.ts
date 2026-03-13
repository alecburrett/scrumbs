import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = path.join(__dirname, 'skills')

function loadSkills(): Record<string, string> {
  const skills: Record<string, string> = {}

  try {
    const files = fs.readdirSync(SKILLS_DIR)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const name = file.replace('.md', '')
        skills[name] = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf-8')
      }
    }
  } catch {
    // Skills directory may not exist in dist — that's OK
  }

  return Object.freeze(skills)
}

export const SKILL_CONTENT: Record<string, string> = loadSkills()

export function getSkill(name: string): string {
  return SKILL_CONTENT[name] ?? ''
}
