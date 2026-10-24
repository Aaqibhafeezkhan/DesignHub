import { expect, test, type Page } from "@playwright/test";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAALklEQVR4nO3NMQkAAAgAMJN4G8L+GMsMnsJg/2KqT7LnJAQCgUAgEAgEAsGXYAETe5w9vz8VcQAAAABJRU5ErkJggg==",
  "base64",
);

/** Hosts a model could be reached on. The app must never contact one without a key the person pasted. */
const AI_HOSTS = [/anthropic\.com$/, /openai\.com$/, /openrouter\.ai$/, /googleapis\.com$/, /mistral\.ai$/];

test.describe("Brand DNA makes no AI request without a key", () => {
  async function watch(page: Page) {
    const hosts: string[] = [];
    page.on("request", (request) => {
      const { hostname, protocol } = new URL(request.url());
      if (protocol === "http:" || protocol === "https:") hosts.push(hostname);
    });
    return hosts;
  }

  test("the on-device provider keeps the image on the device", async ({ page, baseURL }) => {
    const appHost = new URL(baseURL!).hostname;
    const hosts = await watch(page);
    await page.goto("/brand-dna");
    await page
      .locator('input[type="file"][aria-label="Source images"]')
      .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByText(/Apply to brand/i).first()).toBeVisible();
    // Nothing went to a model host, and the image analysis made no request of its own.
    expect(hosts.filter((host) => AI_HOSTS.some((pattern) => pattern.test(host)))).toEqual([]);
    expect(hosts.filter((host) => host !== appHost && !/(^|\.)(googleapis|gstatic)\.com$/.test(host))).toEqual([]);
  });

  for (const provider of ["AI (your key)", "AI (OpenAI-compatible)"]) {
    test(`${provider} with no key set sends nothing`, async ({ page }) => {
      const hosts = await watch(page);
      await page.goto("/brand-dna");
      await page.getByRole("radio", { name: provider }).click();
      await page
        .locator('input[type="file"][aria-label="Source images"]')
        .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
      // With no connection saved the studio explains what is missing and shows the on-device result.
      await expect(page.getByText(/on-device result/).first()).toBeVisible();
      expect(hosts.filter((host) => AI_HOSTS.some((pattern) => pattern.test(host)))).toEqual([]);
    });
  }

  test("a saved but unreviewed OpenAI-compatible connection still sends nothing", async ({ page }) => {
    const hosts = await watch(page);
    await page.goto("/brand-dna");
    await page.getByRole("radio", { name: /AI \(OpenAI-compatible\)/ }).click();
    await page
      .locator('input[type="file"][aria-label="Source images"]')
      .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
    await page.getByLabel("Endpoint").fill("https://api.openai.com/v1");
    await page.getByLabel("Model", { exact: true }).fill("gpt-test");
    await page.getByLabel("API key").fill("sk-test-0123456789abcdef");
    await page.getByRole("button", { name: "Save key in this browser" }).click();
    await expect(page.getByRole("group", { name: "What will be sent" })).toBeVisible();
    await expect(page.getByText(/Sent to: api\.openai\.com/)).toBeVisible();
    expect(hosts.filter((host) => AI_HOSTS.some((pattern) => pattern.test(host)))).toEqual([]);
  });
});
