import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Local PNG data keeps social cards independent of the site's public hostname. */
export async function brandImage(): Promise<string> {
  const bytes = await readFile(join(process.cwd(), "public/brand/launch-mark.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}
