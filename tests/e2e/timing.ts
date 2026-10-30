import { expect, type TestInfo } from "@playwright/test";

/**
 * A timing bound that is checked on a developer machine and only recorded on CI. Shared runners are slower and
 * noisier than any bound that is useful locally, so there the number is attached to the report, not asserted.
 */
export async function expectUnder(testInfo: TestInfo, name: string, value: number, limit: number) {
  await testInfo.attach(name, { body: String(Math.round(value)), contentType: "text/plain" });
  if (!process.env.CI) expect(value, `${name} (ms)`).toBeLessThan(limit);
}
