// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://livenzo-room-finder-hub.lovable.app"

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/find-room", changefreq: "daily", priority: "0.9" },
]

async function getPublicRoomEntries(): Promise<SitemapEntry[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    console.warn("Supabase configuration unavailable; writing static sitemap entries only")
    return []
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_room_listings`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    })

    if (!response.ok) {
      console.warn(`Public room sitemap request failed (${response.status}); writing static entries only`)
      return []
    }

    const rooms = (await response.json()) as { id?: string }[]
    return rooms
      .filter((room): room is { id: string } => typeof room.id === "string" && room.id.length > 0)
      .map((room) => ({ path: `/room/${encodeURIComponent(room.id)}`, changefreq: "daily", priority: "0.8" }))
  } catch (error) {
    console.warn("Could not load public rooms for sitemap; writing static entries only", error)
    return []
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

const roomEntries = await getPublicRoomEntries()
const sitemapEntries = [...entries, ...roomEntries]

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(sitemapEntries))
console.log(`sitemap.xml written (${sitemapEntries.length} entries)`)
