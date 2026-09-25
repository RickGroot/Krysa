import { defineConfig } from "vite";

// `pnpm build:notify`: the krysa-notify function as one self-contained file,
// for pasting into the Supabase dashboard's function editor (see README).
export default defineConfig({
  publicDir: false,
  build: {
    lib: { entry: "supabase/functions/krysa-notify/index.ts", formats: ["es"], fileName: () => "index.js" },
    outDir: "dist/notify",
    target: "es2022",
    minify: false,
  },
});
