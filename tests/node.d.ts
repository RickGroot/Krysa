// @types/node isn't installed; the contrast and font tests only need these calls.
declare module "node:fs" {
  export function readFileSync(path: URL, encoding: "utf8"): string;
  export function readFileSync(path: URL): Uint8Array;
}
