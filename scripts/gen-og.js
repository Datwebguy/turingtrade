import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

const svgPath = join(__dirname, '../public/og.svg')
const pngPath = join(__dirname, '../public/og.png')

sharp(readFileSync(svgPath))
  .png()
  .toFile(pngPath)
  .then(() => console.log('✓ public/og.png generated (1200×630)'))
  .catch(err => { console.error('Error:', err); process.exit(1) })
