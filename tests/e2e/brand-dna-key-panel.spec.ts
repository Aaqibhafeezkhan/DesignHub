import { expect, test, type Page } from "@playwright/test";

const BRAND_DNA_PATH = "/brand-dna";

const FAKE_KEY = "sk-ant-test-0123456789abcdef";
const KEY_RECORD = "designhub:brand-dna-key";
const IMAGE_NAME = "logo.png";

/** A 32x32 two-color PNG, enough for the studio to read and downscale. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAALklEQVR4nO3NMQkAAAgAMJN4G8L+GMsMnsJg/2KqT7LnJAQCgUAgEAgEAsGXYAETe5w9vz8VcQAAAABJRU5ErkJggg==",
  "base64",
);

type StoredKey = { key: string; reviewed: boolean };

/** Reads the key straight from IndexedDB (database "designhub", table "kv"), the way the app stores it. */
async function readStoredKey(page: Page): Promise<StoredKey | null> {
  const raw = await page.evaluate(
    (name) =>
      new Promise<string | null>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("kv")) {
            db.close();
            resolve(null);
            return;
          }
          const request = db.transaction("kv", "readonly").objectStore("kv").get(name);
          request.onerror = () => {
            db.close();
            reject(request.error);
          };
          request.onsuccess = () => {
            db.close();
            const record = request.result as { value?: string } | undefined;
            resolve(record?.value ?? null);
          };
        };
      }),
    KEY_RECORD,
  );
  return raw ? (JSON.parse(raw) as StoredKey) : null;
}

test("the AI key is reviewed before anything is sent, and removing it deletes the record", async ({ page }) => {
  // Every request to the provider is recorded and failed, so nothing real can leave the browser.
  const providerRequests: string[] = [];
  await page.route(
    (url) => url.hostname === "api.anthropic.com",
    (route) => {
      providerRequests.push(route.request().url());
      return route.abort("blockedbyclient");
    },
  );

  await page.goto(BRAND_DNA_PATH);
  await page.getByRole("button", { name: "Change provider" }).click();
  await page.getByRole("radio", { name: /AI \(your key\)/ }).click();
  await page
    .locator('input[type="file"][aria-label="Source images"]')
    .setInputFiles({ name: IMAGE_NAME, mimeType: "image/png", buffer: PNG });

  // Save a key: it lands in IndexedDB, not yet reviewed.
  await page.getByLabel("API key").fill(FAKE_KEY);
  await page.getByRole("button", { name: "Save key in this browser" }).click();
  await expect(page.getByText(`Key saved (ends in ${FAKE_KEY.slice(-4)})`)).toBeVisible();
  await expect.poll(() => readStoredKey(page)).toEqual({ key: FAKE_KEY, reviewed: false });

  // The review shows the exact image that would be sent, and nothing has been requested yet.
  const review = page.getByRole("group", { name: "What will be sent" });
  await expect(review).toBeVisible();
  await expect(review.getByRole("img", { name: `Downscaled copy of ${IMAGE_NAME}, as sent` })).toBeVisible();
  expect(providerRequests).toHaveLength(0);

  // Approving records the consent. Only now may a request be attempted (and it is blocked).
  await review.getByRole("button", { name: "Send these images when I analyze" }).click();
  await expect(page.getByText("You have reviewed what is sent.")).toBeVisible();
  await expect.poll(() => readStoredKey(page)).toEqual({ key: FAKE_KEY, reviewed: true });
  await expect.poll(() => providerRequests.length).toBeGreaterThan(0);

  // Removing the key brings back the form and deletes the stored record, consent included.
  await page.getByRole("button", { name: "Remove key" }).click();
  await expect(page.getByLabel("API key")).toBeVisible();
  await expect.poll(() => readStoredKey(page)).toBeNull();
});
