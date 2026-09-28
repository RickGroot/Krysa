// @types/node isn't installed; the contrast test only needs this one call.
declare module "node:fs" {
  export function readFileSync(path: URL, encoding: "utf8"): string;
}
