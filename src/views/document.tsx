import type { Child } from "hono/jsx";
import CSS from "../styles.css";

const COPY_SCRIPT = `(() => {
  const toast = document.getElementById("toast");
  let timer;
  const show = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 1100);
  };
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const value = el.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        show("Copied " + (value.length > 40 ? "URL" : value));
      } catch {
        show("Copy failed");
      }
    });
  });
})();`;

export interface ShellProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  children: Child;
}

export const Shell = ({ title, description, canonical, ogImage, children }: ShellProps) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="color-scheme" content="light" />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? <meta property="og:image:width" content="1200" /> : null}
      {ogImage ? <meta property="og:image:height" content="630" /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body>
      <header class="nav wrap">
        <a class="brand" href="/">
          <i aria-hidden="true" />
          palette
        </a>
        <nav>
          <a href="/#layouts">Layouts</a>
          <a href="/#url">URL</a>
          <a href="/#examples">Examples</a>
        </nav>
        <a class="btn push" href="/random">
          Random palette
        </a>
      </header>
      <main class="wrap">
        {children}
        <footer class="site">
          <span>SVG rendered on the fly. No accounts, no tracking.</span>
          <span>Free to use — a link back is appreciated.</span>
        </footer>
      </main>
      <div class="toast" id="toast">
        Copied
      </div>
      <script dangerouslySetInnerHTML={{ __html: COPY_SCRIPT }} />
    </body>
  </html>
);

export const renderDocument = (props: ShellProps): string =>
  "<!doctype html>" + <Shell {...props} />;
