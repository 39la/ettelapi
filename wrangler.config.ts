import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
  // The stylesheet is inlined into the Worker as a string.
  rules: [{ type: "Text", globs: ["**/*.css"], fallthrough: true }],
});
