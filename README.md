# Hot Reload

Archive hub for the daily **Hot Reload** newsletter: fresh frontend, design systems & AI news.

- `issues/YYYY-MM-DD.html`: each issue exactly as emailed. The daily routine commits a new one every morning (it also still goes to Google Drive and email).
- `site/`: archive and reader templates plus CSS/JS.
- `scripts/build.mjs`: zero-dependency build into `dist/` (archive, a reader page per issue, `search.json`, `feed.xml`, `/latest/`).
- `.github/workflows/pages.yml`: builds and deploys to GitHub Pages on every push to `main`.

```bash
npm run dev     # build and serve on http://localhost:4321
```
