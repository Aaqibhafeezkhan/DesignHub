# Migrating to 2.0

DesignHub 2.0 keeps every brand you made in 1.0. This page says what changes for people who use the app, for anyone who reads or writes `.designhub.json` files, and for contributors who change what a project stores.

## For people using the app

- **Nothing to do.** Projects, version history, share links and files from 1.0 open as they are. Open a project and it is upgraded in memory; the next autosave writes it in the new form.
- **Newer files are refused, not half read.** A file saved by a later DesignHub than yours says so ("This file was saved by a newer version of DesignHub") and imports nothing. Update the app and try again.
- **The social ZIP starts with the core platforms.** The default pack now holds the 20 main platforms. The rest (Kick, Bandcamp, Etsy, Ko-fi and others) are under "More platforms" and are added to a pack by choice. Your own selection is kept with the project from now on.
- **Some backgrounds are merged.** Rings, arcs and squares are one Concentric generator; argyle, plaid and checks are Woven; zigzag, chevron and squiggle are Zigzag. A saved background still opens, as the same look, with the same seed.
- **Two token formats are deprecated.** GTK 4 CSS and Stylus still work and are marked in the picker. They will be removed in 2.1.
- **Brand DNA.** The AI provider is still opt-in and still needs your own key. You can now choose the model, and an OpenAI-compatible endpoint (including a model server on your own machine) is available. Nothing is sent without a key you pasted and a review of what is sent.

## For anyone reading or writing project files

The file has a `version`, and so does the snapshot inside it:

```json
{
  "format": "designhub.project",
  "version": 2,
  "name": "Acme",
  "favorite": false,
  "tags": ["client"],
  "snapshot": { "version": 2, "brand": {}, "colors": {}, "social": { "packSelection": null } }
}
```

What version 2 changes in a snapshot:

| Field                         | Version 1                                   | Version 2                                                                          |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `version` (file and snapshot) | `1`                                         | `2`                                                                                |
| `social.packSelection`        | not stored                                  | `null` for the default (core platforms), or a list of template ids                 |
| `effects.settings`            | only the effects that existed when it saved | every effect: the ones added later (duotone, scrim, card tilt) have their defaults |

How a version is read:

- A file with no `version` is read as version 1. A version 1 file or snapshot is migrated step by step to the current one, in memory, then validated and sanitized exactly as before (logos are re-sanitized, unknown fields are dropped).
- A version above the current one is refused with a readable message.
- A `version` that is not a whole number from 1 is not a DesignHub project.
- Share links carry the same version in their JSON, so old links keep opening.
- The `designhub` command line reads version 1 and version 2 files and builds the same formats from either.

If you write files by hand or from a script, write `version: 2` and a version 2 snapshot. Start from a file the app exported.

## For contributors

The migration lives in `lib/projects/migrate.ts`:

- `SCHEMA_VERSION` is the current version.
- `migrations` holds one pure function per version, keyed by the version it upgrades from. Each returns a copy at the next version and never changes its input.
- `migrateSnapshot` runs the steps. It is used when a file is imported, when a share link is opened, and when a project or a saved version is read from IndexedDB (`upgradeStored`).

To change the shape of a snapshot:

1. Raise `SCHEMA_VERSION`, add a step to `migrations` and update `BrandSnapshot`, `captureSnapshot`, `applySnapshot` and `normalizeSnapshot`.
2. Commit a fixture written by the version before your change in `lib/projects/__fixtures__/` (a project, one with history, a list and a share link) and add a test in `lib/projects/migrate.test.ts` that it opens.
3. Keep every older fixture: they are the proof that nothing saved stops opening.
4. If a store that persists its own state changes shape, give it a `migrate` and bump its `version`, as the background store does.
5. Describe the change in this guide.
