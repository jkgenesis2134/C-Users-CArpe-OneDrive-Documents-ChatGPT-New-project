# Deployment handoff

## Fastest user-test deployment

This prototype is a static site. Deploy the project directory to a static host such as Cloudflare Pages, Netlify, Vercel static hosting, or GitHub Pages. The publish directory is the repository root because `index.html` is at the root.

After deployment, test:

1. `/index.html`
2. `/privacy.html`
3. `/terms.html`
4. Upload and drag-and-drop behavior
5. Browser console for failed PDF/DOCX library requests
6. Mobile layout and dark mode

## Before production AI

Create a server-side API layer. Never put an AI key in `app.js` or any browser bundle. The API should accept validated files, extract text, run bounded structured stages, validate model JSON, redact logs, enforce size/rate limits, and return confidence plus limitations.

## Required accounts and secrets

- Hosting account
- AI provider account and server-side key
- Optional document parsing and malware-scanning services
- Optional database and object storage
- Optional scholarly metadata and journal-source providers

Do not commit `.env` files or private manuscript samples.
