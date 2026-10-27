import { expect, test, type Page } from "@playwright/test";

const source = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><metadata>Comparison fixture</metadata><rect x="20.123456" y="10.123456" width="200" height="100" fill="#6366FF"/></svg>`;
const dividerName = "Original and optimized SVG divider";

/** On a phone one studio pane shows at a time; on a desktop the bar is hidden and every pane is already there. */
async function show(page: Page, pane: "Controls" | "Preview" | "Output") {
  const bar = page.getByRole("navigation", { name: "Studio panes" });
  if (await bar.isVisible()) await bar.getByRole("button", { name: pane, exact: true }).click();
}

async function openComparison(page: Page) {
  await page.goto("/svg");
  await expect(page.getByRole("button", { name: /^Switch to (light|dark) theme$/ })).toBeVisible();
  await page.getByLabel("Source", { exact: true }).fill(source);
  await expect(page.getByLabel("Source", { exact: true })).toHaveValue(source);
  await show(page, "Preview");
  await page.getByRole("switch", { name: "Compare optimized SVG", exact: true }).press("Space");
  await expect(page.getByRole("slider", { name: dividerName })).toBeVisible();
}

async function expectAligned(page: Page) {
  const original = page.getByRole("img", { name: "Original SVG", exact: true });
  const optimized = page.getByRole("img", { name: "Optimized SVG", exact: true });
  await expect(original).toBeVisible();
  await expect(optimized).toBeVisible();
  await expect
    .poll(() => original.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  await expect
    .poll(() => optimized.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  expect(await original.boundingBox()).toEqual(await optimized.boundingBox());
}

test("comparison works with keyboard, announces values and clamps at both edges", async ({ page }) => {
  await openComparison(page);
  const divider = page.getByRole("slider", { name: dividerName });
  await divider.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "51");
  await expect(divider).toHaveAttribute("aria-valuetext", "51% original, 49% optimized");
  await divider.press("ArrowDown");
  await expect(divider).toHaveAttribute("aria-valuenow", "50");
  await divider.press("Shift+ArrowUp");
  await expect(divider).toHaveAttribute("aria-valuenow", "60");
  await divider.press("Home");
  await divider.press("ArrowLeft");
  await expect(divider).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("img", { name: "Original SVG", exact: true })).toHaveCSS(
    "clip-path",
    "inset(0px 100% 0px 0px)",
  );
  await divider.press("End");
  await divider.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "100");
  await expect(divider).toBeFocused();
  await expect(page.getByRole("img", { name: "Original SVG", exact: true })).toHaveCSS(
    "clip-path",
    "inset(0px 0% 0px 0px)",
  );
});

for (const width of [1280, 375]) {
  for (const theme of ["dark", "light"]) {
    test(`aligned comparison, drag, zoom and resize at ${width}px in ${theme} theme`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await openComparison(page);
      if (theme === "light") await page.getByRole("button", { name: "Switch to light theme", exact: true }).click();
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expectAligned(page);
      const divider = page.getByRole("slider", { name: dividerName });
      await divider.scrollIntoViewIfNeeded();
      const box = await divider.boundingBox();
      const image = await page.getByRole("img", { name: "Original SVG", exact: true }).boundingBox();
      if (!box || !image) throw new Error("Comparison bounds missing");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(image.x + image.width * 0.75, box.y + box.height / 2, { steps: 5 });
      await expect(divider).toHaveAttribute("aria-valuenow", "75");
      await page.mouse.move(image.x + image.width + 20, box.y + box.height / 2);
      await expect(divider).toHaveAttribute("aria-valuenow", "100");
      await page.mouse.move(image.x - 20, box.y + box.height / 2);
      await page.mouse.up();
      await expect(divider).toHaveAttribute("aria-valuenow", "0");
      await divider.press("ArrowRight");
      await expect(divider).toHaveAttribute("aria-valuenow", "1");
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      await expectAligned(page);
      await page.getByRole("button", { name: "Fit to view", exact: true }).click();
      await page.setViewportSize({ width: width === 375 ? 1280 : 375, height: 812 });
      await show(page, "Preview");
      await expectAligned(page);
      await page.getByRole("switch", { name: "Compare optimized SVG", exact: true }).press("Space");
      await expect(divider).toHaveCount(0);
      await expect(page.getByRole("img", { name: /^SVG preview/ })).toBeVisible();
    });
  }
}

test("invalid or empty input hides comparison; new input and options replace both images", async ({ page }) => {
  await openComparison(page);
  const input = page.getByLabel("Source", { exact: true });
  const original = page.getByRole("img", { name: "Original SVG", exact: true });
  const optimized = page.getByRole("img", { name: "Optimized SVG", exact: true });
  const prior = await optimized.getAttribute("src");
  await show(page, "Controls");
  await page.getByRole("tab", { name: "Optimize", exact: true }).click();
  await page.getByRole("slider", { name: "Precision", exact: true }).press("Home");
  await show(page, "Preview");
  await expect(optimized).not.toHaveAttribute("src", prior ?? "");
  await expect(original).toHaveAttribute("src", /20\.123456/);
  await show(page, "Controls");
  await page.getByRole("switch", { name: "Remove width/height", exact: true }).click();
  await show(page, "Preview");
  await expectAligned(page);
  await show(page, "Controls");
  await page.getByRole("tab", { name: "Document", exact: true }).click();
  for (const invalid of ["", "not SVG", "<div>wrong root</div>"]) {
    await show(page, "Controls");
    await input.fill(invalid);
    await show(page, "Preview");
    await expect(page.getByRole("slider", { name: dividerName })).toHaveCount(0);
    await expect(page.getByRole("switch", { name: "Compare optimized SVG", exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Preview", exact: true }).getByRole("alert")).toBeVisible();
  }
  const replacement = source.replace("#6366FF", "#FF3366").replace("240", "320");
  await show(page, "Controls");
  await page
    .getByLabel("SVG file", { exact: true })
    .setInputFiles({ name: "replacement.svg", mimeType: "image/svg+xml", buffer: Buffer.from(replacement) });
  await expect(original).toHaveAttribute("src", /FF3366/);
  await show(page, "Preview");
  await expect(optimized).toHaveAttribute("src", /f36/);
  await expectAligned(page);
  await show(page, "Controls");
  await page.getByRole("tab", { name: "Optimize", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download optimized SVG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("replacement.min.svg");
});

test("untrusted original and optimized SVG stay sanitized inside image data URLs", async ({ page }) => {
  await openComparison(page);
  await page
    .getByLabel("Source", { exact: true })
    .fill(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" onload="document.title='unsafe-svg'"><script>document.title='unsafe-svg'</script><foreignObject><div id="unsafe-svg">unsafe</div></foreignObject><rect width="200" height="100" fill="red" onclick="alert(1)"/><a href="javascript:alert(1)"><circle r="10"/></a></svg>`,
    );
  await show(page, "Preview");
  await expectAligned(page);
  const images = page.getByRole("region", { name: /^SVG preview/ }).locator("img");
  await expect(images).toHaveCount(2);
  for (const image of await images.all()) {
    const url = await image.getAttribute("src");
    expect(url).toMatch(/^data:image\/svg\+xml;/);
    expect(decodeURIComponent(url ?? "")).not.toMatch(/<script|foreignObject|onload|onclick|javascript:/);
  }
  await expect(page.locator("#unsafe-svg")).toHaveCount(0);
  await expect(page).not.toHaveTitle("unsafe-svg");
});

test("dropping a document replaces the active comparison", async ({ page }) => {
  await openComparison(page);
  const dropped = source.replace("#6366FF", "#00FF00");
  const transfer = await page.evaluateHandle((svg) => {
    const data = new DataTransfer();
    data.items.add(new File([svg], "dropped.svg", { type: "image/svg+xml" }));
    return data;
  }, dropped);
  await page.getByRole("img", { name: "Original SVG", exact: true }).dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByLabel("Source", { exact: true })).toHaveValue(dropped);
  await expect(page.getByRole("img", { name: "Original SVG", exact: true })).toHaveAttribute("src", /00FF00/);
  await expect(page.getByRole("img", { name: "Optimized SVG", exact: true })).toHaveAttribute("src", /0f0/);
  await expectAligned(page);
  await transfer.dispose();
});

test("normal preview keeps layer highlighting when comparison is turned off", async ({ page }) => {
  await openComparison(page);
  await show(page, "Controls");
  await page.getByRole("tab", { name: "Layers", exact: true }).click();
  await page.getByRole("option", { name: "<rect>", exact: true }).click();
  await show(page, "Preview");
  await expect(page.getByRole("img", { name: "Original SVG", exact: true })).not.toHaveAttribute("src", /dh-highlight/);
  await page.getByRole("switch", { name: "Compare optimized SVG", exact: true }).press("Space");
  await expect(page.getByRole("region", { name: "Preview", exact: true }).locator("img")).toHaveAttribute(
    "src",
    /dh-highlight/,
  );
});

test("touch dragging moves the divider on a phone", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await openComparison(page);
  const divider = page.getByRole("slider", { name: dividerName });
  await divider.scrollIntoViewIfNeeded();
  const box = await divider.boundingBox();
  const image = await page.getByRole("img", { name: "Original SVG", exact: true }).boundingBox();
  if (!box || !image) throw new Error("Comparison bounds missing");
  const client = await context.newCDPSession(page);
  const y = box.y + box.height / 2;
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y }] });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: image.x + image.width * 0.25, y }],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(divider).toHaveAttribute("aria-valuenow", "25");
  await context.close();
});

for (const width of [1280, 375]) {
  for (const backdrop of ["Light backdrop", "Transparent checkerboard"]) {
    test(`translucent comparison matches the normal preview on ${backdrop} at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/svg");
      await expect(page.getByRole("button", { name: /^Switch to (light|dark) theme$/ })).toBeVisible();
      await page
        .getByLabel("Source", { exact: true })
        .fill(
          `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" fill="#ff0000" opacity="0.5"/></svg>`,
        );
      await show(page, "Preview");
      await page.getByRole("radio", { name: backdrop, exact: true }).click();
      const preview = page.getByRole("region", { name: "Preview", exact: true });

      // Capture pixels inside each half, away from labels, divider and handle.
      // Compare the rendered PNGs, so overlapping translucent layers cannot pass on geometry alone.
      async function samples() {
        const image = preview.locator("img").first();
        await expect
          .poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0))
          .toBe(true);
        await image.scrollIntoViewIfNeeded();
        const bounds = await image.boundingBox();
        if (!bounds) throw new Error("SVG preview bounds missing");
        const captures: Buffer[] = [];
        for (const fraction of [0.25, 0.75]) {
          captures.push(
            await page.screenshot({
              clip: {
                x: Math.round(bounds.x + bounds.width * fraction) - 8,
                y: Math.round(bounds.y + bounds.height * 0.75) - 8,
                width: 16,
                height: 16,
              },
            }),
          );
        }
        return captures;
      }

      const normal = await samples();
      await testInfo.attach("normal-preview", { body: await preview.screenshot(), contentType: "image/png" });
      await page.getByRole("switch", { name: "Compare optimized SVG", exact: true }).press("Space");
      const divider = page.getByRole("slider", { name: dividerName });
      for (const position of [0, 50, 100]) {
        await divider.press("Home");
        if (position === 100) await divider.press("End");
        else for (let step = 0; step < position / 10; step += 1) await divider.press("Shift+ArrowRight");
        await expect(divider).toHaveAttribute("aria-valuenow", String(position));
        await expectAligned(page);
        const actual = await samples();
        await testInfo.attach(`comparison-${position}`, { body: await preview.screenshot(), contentType: "image/png" });
        expect.soft(actual[0], `Left pixels must match normal preview at ${position}% original`).toEqual(normal[0]);
        expect.soft(actual[1], `Right pixels must match normal preview at ${position}% original`).toEqual(normal[1]);
      }
    });
  }
}
