/** DOM ids of the studio panes the skip links jump to. A page has one studio layout, so the ids are fixed. */
export const STUDIO_PREVIEW_ID = "studio-preview";
export const STUDIO_OUTPUT_ID = "studio-output";

/** The three panes of a studio. On a phone only one shows at a time. */
export type StudioPane = "controls" | "preview" | "output";

/** Sent by the skip links, so a hidden pane is shown before focus moves into it. */
export const STUDIO_PANE_EVENT = "designhub:studio-pane";

export function paneOfId(id: string): StudioPane | null {
  return id === STUDIO_PREVIEW_ID ? "preview" : id === STUDIO_OUTPUT_ID ? "output" : null;
}
