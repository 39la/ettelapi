import { renderDocument } from "./document";

export function renderErrorPage(status: number, message: string): string {
  return renderDocument({
    title: `${status} — ettelapi`,
    description: message,
    children: (
      <>
        <p class="kicker">Error {status}</p>
        <h1>{message}</h1>
        <p class="lede">Colors are 3 or 6 hex digits joined with hyphens, up to 12. For example:</p>
        <p>
          <code>/f94144-f3722c-f8961e-f9c74f.svg</code>
        </p>
        <p class="error-actions">
          <a class="btn" href="/">
            Back to palette
          </a>
        </p>
      </>
    ),
  });
}
