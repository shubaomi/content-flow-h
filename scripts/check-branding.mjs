import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const blockedTerms = [
  '起哥',
  '起哥的AI实战',
]

const files = [
  'index.html',
  'src/components/layout/Sidebar.tsx',
  'src/pages/DirectorySetup.tsx',
]

const findings = []

for (const file of files) {
  const content = readFileSync(join(process.cwd(), file), 'utf8')
  for (const term of blockedTerms) {
    if (content.includes(term)) {
      findings.push(`${file}: contains "${term}"`)
    }
  }
}

if (findings.length > 0) {
  console.error('Branding check failed. Upstream brand text leaked back into local build:')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log('Branding check passed.')
