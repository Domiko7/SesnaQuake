import { defineConfig } from "vite";
import { version } from "./package.json"

export default defineConfig({
  base: "/SesnaQuake/",
  build: {
    outDir: "dist",
  },
  define : {
    __APP_VERSION__: JSON.stringify(version),
  },
});
