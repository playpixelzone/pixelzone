import fs from "node:fs/promises";
import path from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function buildCandidates(routePath) {
  const hasExtension = path.extname(routePath) !== "";

  if (hasExtension) {
    return [routePath];
  }

  return [routePath, `${routePath}.html`, path.join(routePath, "index.html")];
}

function toSafeAbsolute(baseDir, requestPath) {
  const cleanedPath = requestPath.replace(/\\/g, "/");
  const absolutePath = path.resolve(baseDir, `.${cleanedPath}`);
  const normalizedBase = `${path.resolve(baseDir)}${path.sep}`;

  if (!absolutePath.startsWith(normalizedBase) && absolutePath !== path.resolve(baseDir)) {
    return null;
  }

  return absolutePath;
}

async function findExistingFile(baseDir, candidates) {
  for (const candidate of candidates) {
    const safePath = toSafeAbsolute(baseDir, candidate);
    if (!safePath) {
      continue;
    }

    try {
      const stat = await fs.stat(safePath);
      if (stat.isFile()) {
        return safePath;
      }
    } catch {
      // Datei existiert nicht, naechster Kandidat.
    }
  }

  return null;
}

export async function getServerSideProps(context) {
  const { params, res } = context;
  const requestedSegments = params?.route ?? [];
  const routePath = `/${requestedSegments.join("/")}`;
  const projectRoot = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "ssr-content"
  );

  const blockedPrefixes = ["/_next", "/api"];
  if (blockedPrefixes.some((prefix) => routePath.startsWith(prefix))) {
    return { notFound: true };
  }

  const candidates = buildCandidates(routePath);
  const existingFile = await findExistingFile(projectRoot, candidates);

  if (!existingFile) {
    return { notFound: true };
  }

  const extension = path.extname(existingFile).toLowerCase();
  const contentType = MIME_TYPES[extension] ?? "application/octet-stream";
  const isTextFile = contentType.startsWith("text/") || contentType.includes("javascript") || contentType.includes("json");

  const body = await fs.readFile(existingFile, isTextFile ? "utf8" : undefined);

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.end(body);

  return { props: {} };
}

export default function CatchAllServerRoute() {
  return null;
}
