# Adding a social template

The Social Media Studio is a list of templates. Each template is one function that draws the live brand as an SVG string at a platform's exact size. The same function feeds the preview, the PNG, WebP and ZIP exports and the full pack, so a template shows up everywhere once it is registered.

Social templates follow the rules for [mockup templates](mockup-templates.md) and add a few of their own: a fixed platform size, a safe area, zones the platform covers with its own interface, and a registry test that pins the size. This guide builds the Notion page cover end to end. For setup, code style and the pull request process, see [CONTRIBUTING.md](../CONTRIBUTING.md). For a first pull request, [first-contribution.md](first-contribution.md) walks through the whole flow, and the [glossary](glossary.md) explains safe area and brand tokens.

## The pieces

| File                             | What it does                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `lib/social/types.ts`            | `SocialTemplate`, `SocialContext` and the `SocialPlatform` union.                                       |
| `lib/social/templates/*.ts`      | One file per template. Each exports a `SocialTemplate`.                                                 |
| `lib/social/templates/shared.ts` | Backdrops, `heading`, `lockup`, `pill` and `share`.                                                     |
| `lib/mockups/kit.ts`             | Drawing helpers shared with mockups: `mockupDoc`, `text`, `logo`, `wrap`, `truncate`, `onPrimaryLarge`. |
| `lib/social/registry.ts`         | `socialTemplates` (the list that fills the picker, in order) and `socialPlatforms`.                     |
| `lib/social/registry.test.ts`    | The ids and sizes every template must keep.                                                             |
| `lib/social/templates.test.ts`   | The generic tests every registered template gets, and the place for tests of one template.              |

## What a template is

A template is a `SocialTemplate` (see `lib/social/types.ts`):

```ts
export type SocialTemplate = {
  id: string;
  platform: SocialPlatform;
  label: string;
  width: number;
  height: number;
  description: string;
  /** Templates that share a group are styles of one asset, shown nested in the picker. */
  group?: string;
  /** Style name inside the group, e.g. "Minimal". */
  style?: string;
  /** Area every platform crop keeps visible. Content should stay inside it. */
  safe: Rect;
  /** Areas covered by platform UI (profile photo, timestamps). */
  covered?: Rect[];
  render: (ctx: SocialContext) => string;
};
```

`render` is a pure function of the context. It reads:

- `ctx.brand` and `ctx.surface`: the brand tokens and the colors for the current theme (`background`, `surface`, `text`, `muted`, `border`, `primary`, `primaryText`, `secondary`, `onPrimary`). They follow the light and dark switch.
- `ctx.content`: the copy from the Content panel (`name`, `headline`, `subtitle`, `handle`, `github`, `website`, `cta`). Empty fields fall back to the brand's own values.
- `ctx.layout`: the padding and the background style the person picked. `"auto"` keeps the template's own design.
- `ctx.measure` and `ctx.fontCss`: used by the kit to measure text with the real font and to embed it.

Read values from the context instead of hard-coding them, so the template follows the live brand.

## Sizes, safe areas and covered zones

Every template declares three things about its canvas:

- **The exact platform size** (`width` and `height`). Use the size the platform's own help page recommends, and put the source in your pull request.
- **A `safe` rect.** Platforms crop covers to the window width and to the phone's width, so everything that matters stays inside it. A generic test checks that links stay inside the safe rect.
- **`covered` rects.** The platform draws its own interface over part of the image: an avatar, a title, a timestamp. Keep text out of these. A generic test fails if a text baseline falls inside a covered rect and overlaps it horizontally.

Both kinds of rect must fit inside the canvas, which the registry test checks.

## The shared helpers

`lib/social/templates/shared.ts` has the backdrops and the heading:

- `backdrop(ctx, width, height, own)` draws the background. It uses `own()` unless the person picked a background style, in which case every template uses that one. Always draw the background through it.
- `gradientBackdrop`, `glowBackdrop`, `meshBackdrop` and `solidBackdrop` are the backgrounds to pass as `own`.
- `heading(ctx, value, x, y, maxWidth, size, fill, options)` draws wrapped heading lines and returns the markup, the baseline of the last line (`bottom`) and the number of lines.
- `lockup`, `pill` and `share` draw a logo with the brand name, a labelled pill, and split a width between two items on one line.

From `lib/mockups/kit.ts`: `text()` escapes the copy, `logo()` nests the logo (give each copy in one drawing its own `id`), `wrap()` and `truncate()` shorten copy with real font metrics, and `onPrimaryLarge()` picks a readable color on the primary color.

## Walkthrough: the Notion page cover

Notion shows the cover at the top of a page, crops it to the window width, and puts the page icon and title over the lower left. The size is 1500 x 600.

### 1. Add the platform

If the platform is new, add it to the `SocialPlatform` union in `lib/social/types.ts`:

```ts
  | "Ko-fi"
  | "Notion"
  | "Medium";
```

TypeScript then makes sure every template spells its `platform` the same way.

### 2. Write the template

Create `lib/social/templates/notion.ts`. Start from a template with a similar shape; `gumroad.ts` and `patreon.ts` are covers with a covered zone.

```ts
import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 600;
// Notion centre-crops the cover to the window width, so the copy keeps a wide margin.
const SAFE = { x: 150, y: 48, width: W - 300, height: H - 96 };
// The page icon and title sit over the lower left of the cover.
const TITLE = { x: SAFE.x, y: H - 180, width: 560, height: 180 };

export const notionCover: SocialTemplate = {
  id: "notion-cover",
  platform: "Notion",
  label: "Page cover",
  width: W,
  height: H,
  description: "Page cover, 1500 × 600. The page icon and title cover the lower left and Notion crops the sides.",
  safe: SAFE,
  covered: [TITLE],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const accent = onColor ? on : surface.primaryText;
    const maxWidth = SAFE.width;
    const mark = 72;
    const name = heading(ctx, content.name, SAFE.x, SAFE.y + mark + 90, maxWidth, 76, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, Math.min(maxWidth, 900), 30, "b", 2);
    // The links run along the bottom, to the right of the title zone.
    const linksX = TITLE.x + TITLE.width + 40;
    const links = truncate(
      ctx,
      [content.website, content.handle].filter((item) => item.trim()).join("  ·  "),
      SAFE.x + SAFE.width - linksX,
      26,
      "bb",
    );
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: SAFE.x, y: SAFE.y, width: mark, height: mark }, onColor ? on : undefined, "notion-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(SAFE.x, name.bottom + 64 + i * 40, line, { size: 30, fill: on, opacity: 0.85 })).join("")}
      ${text(SAFE.x + SAFE.width, H - 72, links, { size: 26, fill: accent, font: "bb", anchor: "end", opacity: onColor ? 0.92 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
```

What to notice:

- The name, tagline and mark sit in the top left, above the `TITLE` zone, and the links are right aligned with a maximum width that stops before the zone.
- `onColor` is true when the background is the gradient, where text sits on the primary color and uses `onPrimaryLarge()`. On any other background the text uses `surface.text`.
- A long name is cut to one line by `heading(..., { maxLines: 1 })`, a long tagline to two lines by `wrap()`, and a long link by `truncate()`, so nothing overflows.
- The logo has its own id (`"notion-mark"`), so its gradients can't collide with another logo in the same drawing.

### 3. Register it

In `lib/social/registry.ts`, import the template, add it to `socialTemplates`, and add the platform to `socialPlatforms`:

```ts
import { notionCover } from "@/lib/social/templates/notion";

export const socialTemplates: SocialTemplate[] = [
  // ...the existing templates
  notionCover,
];
```

```ts
export const socialPlatforms: SocialPlatform[] = [
  // ...the existing platforms
  "Notion",
];
```

That is all the wiring. The picker, the live preview, PNG, WebP and ZIP export and the full pack all read the registry.

### 4. Pin the size in the registry test

`lib/social/registry.test.ts` lists each template's id and size. Add yours, so a later change can't resize it by accident:

```ts
  ["notion-cover", 1500, 600],
```

## Tests

Two test files run every registered template, so a new template is covered as soon as it is in the registry:

- `lib/social/registry.test.ts` checks that ids are unique, that the platform is listed, and that the safe rect and every covered rect fit inside the canvas.
- `lib/social/templates.test.ts` checks that the SVG is well-formed in light and dark at the platform size, that it escapes an awkward brand name, that a 60 character website, handle and name stay inside the safe rect, and that no text sits on a covered zone.

Add a `describe` block for what is specific to your template. For the Notion cover and the Medium banner, that is a very short and a very long name:

```ts
describe.each(["notion-cover", "medium-banner"])("%s with very short and very long names", (id) => {
  const template = socialTemplates.find((item) => item.id === id)!;

  test.each([
    ["3 character", "Axe"],
    ["60 character", "Northwind Analytics Cooperative for Sustainable Data Systems"],
  ])("a %s name stays inside the safe area", (_label, name) => {
    for (const mode of modes) {
      const ctx = socialContext(mode, name);
      for (const box of textBoxes(ctx, template.render(ctx))) {
        expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
        expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
      }
    }
  });
});
```

`textBoxes()` measures every top-level `<text>` the way the templates do, so it catches text that runs past the safe rect.

## Checklist

1. Add the platform to `SocialPlatform` in `lib/social/types.ts` if it is new.
2. Create `lib/social/templates/<name>.ts` and export a `SocialTemplate` with the exact size, a `safe` rect and any `covered` zones.
3. Read colors, fonts and the logo from the context, draw the background through `backdrop()`, and shorten user copy with `heading()`, `wrap()` or `truncate()`.
4. Register the template and the platform in `lib/social/registry.ts`, and add its id and size to `lib/social/registry.test.ts`.
5. Run `pnpm dev`, open the Social Media Studio, and check the template in light and dark, with a long brand name and headline, and with an uploaded non-square logo. Export PNG, WebP and the ZIP.
6. Add a line under `Unreleased` in `CHANGELOG.md`, and the platform to the list in `README.md`.
7. Run `pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build`.

## Real templates to copy from

- `lib/social/templates/gumroad.ts` and `patreon.ts`: covers with an avatar zone.
- `lib/social/templates/substack.ts` and `devto.ts`: banners that scale with the page width.
- `lib/social/templates/etsy.ts`: a wide shop banner with a covered shop-icon zone.
- `lib/social/templates/github/`: several styles of one asset, shown nested in the picker.
