# Simple and Advanced mode

Every studio can show its common controls first (Simple) or every control (Advanced). The switch is in each studio's header, and "Switch to Simple mode" and "Switch to Advanced mode" are in the command palette. A first visit starts in Simple. Someone who already used DesignHub starts in Advanced, so nothing they know disappears. The choice is remembered on this device (`designhub:mode`, see [storage](storage.md)).

**Hiding a control never changes its value.** A seed, a rotation or an OpenType feature you set in Advanced keeps applying in Simple mode, and exports do not change with the mode.

## What each mode shows

| Studio                | Simple                                                                   | Advanced adds                                                      |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Typography Studio     | The font browser, pairing, scale and export                              | The OpenType features panel                                        |
| Color Studio          | Palette, harmonies, shades and contrast                                  | Fine controls of the OKLCH editor and gradient                     |
| Effects Lab           | The effect, its main controls and the CSS and Tailwind code              | The other settings of each effect and the three other code formats |
| Background Studio     | The generator, density, scale, colors, size and Randomize                | Seed, rotation and the generator's own options                     |
| Export Engine         | Brand name, variable prefix and color notation                           | Spacing and radius bases, and which sections to include            |
| Logo Studio           | The logo, the Variants view and the export                               | The Guides panel and the Edit panel (recolor and source)           |
| Icon Studio           | Search, the library, color, stroke width, padding and the background     | Stroke corners and the transform controls (rotate, flip, rotation) |
| SVG Playground        | The Document and Optimize tabs                                           | The Layers and Sprite tabs                                         |
| Brand Studio and more | Not switched: they show everything, with folded panels for the long ones | -                                                                  |

## For contributors

Wrap a group of controls in `<Advanced>` (`components/ui/advanced.tsx`) or mark a whole panel `advanced`. Mark a group, not a single field, so Simple mode stays tidy. A tab that is Advanced only must send the person back to a tab that always exists when they leave Advanced (the SVG Playground does this). Add the studio's switch with `actions={<ModeSwitch />}` on its `PageHeader`, and add the controls to the table above and to `tests/e2e/modes.spec.ts`.
