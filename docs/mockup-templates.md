# Adding a mockup template

The Mockup Studio is a list of templates. Each template is one function that draws the live brand as an SVG string. The same function feeds the preview, the PNG, WebP and PDF exports and the other studios that reuse a mockup, so a template shows up everywhere once it is registered.

This guide builds a small template end to end, then points at the real ones to copy from. For setup, code style and the pull request process, see [CONTRIBUTING.md](../CONTRIBUTING.md). Brand book pages work the same way and have their own guide: [guidelines-pages.md](guidelines-pages.md).

## The pieces

| File                               | What it does                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `lib/mockups/types.ts`             | The `MockupTemplate` and `MockupContext` types.                                              |
| `lib/mockups/templates/*.ts`       | One file per template. Each exports a `MockupTemplate`.                                      |
| `lib/mockups/kit.ts`               | Drawing helpers: `mockupDoc`, `text`, `logo`, `wrap`, `truncate`, `desk`, `rotate`, `lines`. |
| `lib/mockups/templates/devices.ts` | Device frames (`phone`, `tablet`, `laptop`, `monitor`, `watch`) and the `studio` backdrop.   |
| `lib/mockups/registry.ts`          | `mockupTemplates`, the list that fills the picker, in order.                                 |
| `lib/social/templates.test.ts`     | The generic tests every registered mockup gets, and the place for tests of one template.     |

## What a template is

A template is a `MockupTemplate` (see `lib/mockups/types.ts`):

```ts
export type MockupTemplate = {
  id: string; // stable and kebab-case; saved in the studio's settings
  label: string; // the name in the picker
  category: "Print" | "Screens";
  description: string;
  render: (ctx: MockupContext) => string; // returns an SVG document
};
```

`render` is a pure function of the context. It reads:

- `ctx.brand`: the brand tokens (name, logo, typography, radius, colors).
- `ctx.surface`: the colors for the current theme (`background`, `surface`, `text`, `muted`, `border`, `primary`, `secondary`, `onPrimary`). It follows the light and dark switch.
- `ctx.content`: the copy the person typed in the Content panel (`person`, `role`, `email`, `website`, `address`, `headline`, `cta`).
- `ctx.measure` and `ctx.fontCss`: used by the kit to measure text with the real font and to embed it.

Read values from the context instead of hard-coding them, so the template follows the live brand and works in both themes. Neutral device colors (a bezel, a stand) can be fixed.

## The drawing kit

`lib/mockups/kit.ts` has what almost every template needs:

- `mockupDoc(ctx, width, height, body, defs?)` wraps your drawing in the final SVG and embeds the brand fonts. It also defines the `.h` (heading), `.b` (body) and `.bb` (bold body) text classes and the `soft` shadow filter.
- `text(x, y, value, { size, fill, font, anchor, spacing, opacity })` draws one line and escapes the copy, so a name like `A & B` can't break the SVG.
- `logo(ctx, rect, color?, id?)` nests the brand logo in a rectangle, recolored when you pass a color. **Give every copy of the logo in one drawing its own `id`**, or gradients inside the logo collide.
- `wrap(ctx, value, maxWidth, size, font, maxLines)` breaks text into lines with real font metrics and adds `...` when it has to cut. `truncate(ctx, value, maxWidth, size, font)` fits one line.
- `onPrimaryLarge(ctx)` picks a readable color for large text and marks on the primary color.
- `desk`, `rotate` and `lines` draw a print backdrop, a rotated group and placeholder text lines.

Device frames and the studio backdrop live in `devices.ts`: `studio(ctx, w, h)` for screens, `phone`, `tablet`, `laptop`, `monitor` and `watch` for devices.

## Walkthrough: a name badge

This template draws a badge with the logo, a name and a title. It is small on purpose; every part of a real template is in it.

```ts
import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { studio } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const WIDTH = 1000;
const HEIGHT = 700;
const CARD = { x: 250, y: 120, width: 500, height: 460 };

/** The badge itself, so a test can check it without the backdrop. */
export function badge(ctx: MockupContext): string {
  const { surface, brand, content } = ctx;
  const inner = CARD.width - 80;
  const name = truncate(ctx, content.person, inner, 40, "h");
  const title = truncate(ctx, `${content.role} at ${brand.name}`, inner, 22, "b");
  return `<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.width}" height="${CARD.height}" rx="${Math.min(brand.radius, 28)}" fill="${surface.background}" filter="url(#soft)"/>
    <rect x="${CARD.x}" y="${CARD.y}" width="${CARD.width}" height="150" rx="${Math.min(brand.radius, 28)}" fill="${surface.primary}"/>
    ${logo(ctx, { x: CARD.x + 40, y: CARD.y + 35, width: 80, height: 80 }, onPrimaryLarge(ctx), "badge-mark")}
    ${text(CARD.x + 40, CARD.y + 250, name, { size: 40, fill: surface.text, font: "h" })}
    ${text(CARD.x + 40, CARD.y + 292, title, { size: 22, fill: surface.muted })}`;
}

export const nameBadge: MockupTemplate = {
  id: "name-badge",
  label: "Name badge",
  category: "Print",
  description: "A conference badge with the logo, a name and a title.",
  render(ctx) {
    return mockupDoc(ctx, WIDTH, HEIGHT, `${studio(ctx, WIDTH, HEIGHT)}${badge(ctx)}`);
  },
};
```

Three things to notice:

1. **Everything brand-specific comes from the context.** The corner radius is capped (`Math.min(brand.radius, 28)`) so a very round brand doesn't turn the card into a pill.
2. **User copy is shortened, never trusted to fit.** `truncate` keeps a long name or title inside the card. Test with a 60 character name.
3. **The `soft` filter comes from `mockupDoc`.** You can use `filter="url(#soft)"` on any shape without defining it.

## Register it

In `lib/mockups/registry.ts`, import the template and add it to `mockupTemplates`. Its position in the array is its position in the picker, grouped by `category`:

```ts
import { nameBadge } from "@/lib/mockups/templates/name-badge";

export const mockupTemplates: MockupTemplate[] = [
  // ...the existing templates
  nameBadge,
];
```

That is all the wiring. The picker, the live preview, PNG, WebP and PDF export and the studio's theme switch all read the registry.

## Tests

`lib/social/templates.test.ts` runs every registered mockup through the same checks, so a new template is covered as soon as it is in the registry:

- it renders well-formed XML in light and dark, with an integer `width` and `height` that match its `viewBox`;
- it renders well-formed XML with an awkward brand name (`trickyName`), which proves the copy is escaped.

Add a `describe` block for your template that checks what is specific to it. For the badge, that means a long name stays inside the card. Measure the text the way the kit does, with `ctx.measure`:

```ts
describe("name badge", () => {
  test("a long name is shortened to fit the card", () => {
    for (const mode of modes) {
      const ctx = mockupContext(mode);
      const long = { ...ctx, content: { ...ctx.content, person: "Alexandria Montgomery-Featherstonehaugh III" } };
      const names = [...badge(long).matchAll(/<text class="h"[^>]*>([^<]*)<\/text>/g)];
      for (const [, value] of names) {
        const { heading, headingWeight } = long.brand.typography;
        expect(long.measure(value!, heading, headingWeight, 40)).toBeLessThanOrEqual(420);
      }
    }
  });
});
```

## Checklist

1. Create `lib/mockups/templates/<name>.ts` and export a `MockupTemplate`. Read colors, fonts, radius and the logo from the context.
2. Draw text with `text()` and every logo with `logo()` and a unique id. Shorten user copy with `truncate()` or `wrap()`.
3. Register it in `lib/mockups/registry.ts`.
4. Add a test for what is specific to it (see above).
5. Run `pnpm dev`, open the Mockup Studio, and check the template in light and dark, with a long brand name and with an uploaded non-square logo. Export PNG, WebP and PDF.
6. Add a line under `Unreleased` in `CHANGELOG.md`.
7. Run `pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build`.

## Real templates to copy from

- `lib/mockups/templates/envelope.ts`: a print piece on a desk, with rotated groups.
- `lib/mockups/templates/smartwatch.ts`: a small device with a face and a notification, and the `watch()` frame in `devices.ts`.
- `lib/mockups/templates/app-store.ts`: three phones with captions that wrap and shorten, reusing screens from `mobile-app.ts`.
- `lib/mockups/templates/lock-screen.ts`: reuses the logo pack's app icon for the notification icons.
