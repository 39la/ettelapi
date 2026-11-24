# palette — agent notes

- Use the **`cf`** CLI for Cloudflare: `bun run dev`, `bun run build`, `bun run validate`, `bun run deploy`.
  Do not call Wrangler directly; it is only cf's bundler.
- Before finishing: `bun run check` (typecheck, oxlint, oxfmt --check, tests).
- Layout renderers live in `src/layouts/<layout>.ts`; register changes in `src/layouts/index.ts`.
- No production deploy without explicit confirmation.
