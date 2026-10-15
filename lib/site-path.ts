export function sitePath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!base || !path.startsWith("/") || path.startsWith("//") || path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}#`)) return path;
  return `${base}${path}`;
}
