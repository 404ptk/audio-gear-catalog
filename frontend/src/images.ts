import { GearItem } from './api'

// Import all images from attachments and group them by folder (product slug)
const importedImages = import.meta.glob('../attachments/**/*.{png,jpg,jpeg,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function extractLeadingNumber(name: string) {
  const m = name.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER
}

function slugifyName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}

const imagesByFolder: Record<string, string[]> = (() => {
  const tmp: Record<string, { url: string; filename: string }[]> = {}
  for (const [path, url] of Object.entries(importedImages)) {
    // path example: ../attachments/audio_technica_ath_m50x/1.jpg
    const m = path.match(/\.\.\/attachments\/([^/]+)\/([^/]+)$/)
    if (!m) continue
    const folder = m[1]
    const filename = m[2]
    ;(tmp[folder] ||= []).push({ url, filename })
  }
  const out: Record<string, string[]> = {}
  for (const [folder, arr] of Object.entries(tmp)) {
    out[folder] = arr
      .sort((a, b) => {
        const diff = extractLeadingNumber(a.filename) - extractLeadingNumber(b.filename)
        return diff !== 0 ? diff : a.filename.localeCompare(b.filename)
      })
      .map((x) => x.url)
  }
  return out
})()

export function getItemImages(item: GearItem): string[] {
  const slug = slugifyName(item.name)
  const imgs = imagesByFolder[slug] || []
  if (imgs.length) return imgs
  return item.image_url ? [item.image_url] : []
}
