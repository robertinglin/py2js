import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/py2js.ts"),
      name: "PY2JS",
      formats: ["es"],
      fileName: "py2js",
    },
  },
  plugins: [dts()],
});
