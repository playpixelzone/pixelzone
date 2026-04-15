import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const targetDir = path.join(projectRoot, "ssr-content");

const entriesToCopy = [
  "index.html",
  "login.html",
  "admin.html",
  "auth.js",
  "home-news.js",
  "style.css",
  "robots.txt",
  "sitemap.xml",
  "games"
];

async function syncSsrContent() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  for (const entry of entriesToCopy) {
    const sourcePath = path.join(projectRoot, entry);
    const destinationPath = path.join(targetDir, entry);
    await cp(sourcePath, destinationPath, { recursive: true, force: true });
  }

  console.log("SSR content synced:", entriesToCopy.join(", "));
}

syncSsrContent().catch((error) => {
  console.error("Failed to sync SSR content:", error);
  process.exitCode = 1;
});
