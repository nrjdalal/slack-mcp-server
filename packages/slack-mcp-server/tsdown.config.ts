import { defineConfig } from "tsdown"

export default defineConfig({
  dts: {
    tsgo: true,
  },
  entry: ["src/index.ts", "src/bin.ts"],
  minify: true,
  outDir: "dist",
})
