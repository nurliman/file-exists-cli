import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: "inline",
  clean: true,
  dts: false,
  target: "node16",
});
