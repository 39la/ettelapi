import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "f1951e895caac3e3bbcc1b5bcfe1d74a",
  worker: {
    name: "palette",
    compatibilityDate: "2026-11-01",
    entrypoint: "src/index.ts",
    observability: {
      enabled: true,
    },
  },
});
