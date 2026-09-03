# App support and privacy page pattern

Use the Fresh Guess pages as the current reference implementation when adding an app:

- `support/freshguess/index.html`
- `privacy/freshguess/index.html`

For an app with a marketing page, use the Outside Timer group as the reference:

- `outside-timer/index.html`
- `outside-timer/support/index.html`
- `outside-timer/privacy/index.html`

## Repeatable structure

1. Create `support/[app-slug]/index.html` and `privacy/[app-slug]/index.html`.
2. Copy the matching Fresh Guess page and replace app-specific titles, descriptions, canonical URLs, copy, mail subjects, and cross-links.
3. Keep shared presentation in `style.css`; do not add app-specific styling unless the content truly requires it.
4. Add the app to `support/index.html` and `privacy/index.html`.
5. Add both production URLs to `sitemap.xml`.

For a three-page app group, create `[app-slug]/index.html`, `[app-slug]/support/index.html`, and `[app-slug]/privacy/index.html`. Link all three from the homepage catalog and use the app page as the shared navigation hub.

## Required checks

- One unique page title, meta description, canonical URL, and H1 per page.
- Relative stylesheet and favicon paths must resolve from the nested folder.
- Support email uses `hello@parentcompanyllc.com` with an app-specific subject.
- Support and privacy pages link to one another and to the home page.
- Privacy claims reflect the actual shipping app; do not copy technical claims blindly.
- Pages work at `/support/[app-slug]/` and `/privacy/[app-slug]/` on GitHub Pages.
- All internal links, email links, and sitemap URLs are verified before publishing.
