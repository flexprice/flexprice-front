# Example brand: Acme

The smallest useful brand pack — four files, no layout or page of its own. It shows the
"stick with the original" path: the console keeps Flexprice's sidebar layout and every page, and
only the name, logo, colours, font and a little of the navigation change.

```bash
BRAND_DIR=examples/brands/acme npm run dev
```

| File | Required | What it does |
|---|---|---|
| `brand.ts` | yes | name, logo, favicon, links, font — `BrandPack` in `src/brand/types.ts` |
| `theme.css` | yes | overrides any token from `src/index.css` (colours, `--fp-page-*` layout values) |
| `extensions.tsx` | yes | slots, nav, pages, modules — all optional; `{}` is valid |
| `locales/<lng>/<ns>.json` | no | wording overrides, wired through `loadLocale` in `brand.ts` |

To go further — your own app frame, pages or features — see `src/brand/types.ts` and build on
`src/brand/kit.ts`. A brand normally lives in its own (private) repo; point `BRAND_DIR` at it.
