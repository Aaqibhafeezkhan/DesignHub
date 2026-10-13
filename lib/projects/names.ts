/** The longest a project name may be (the same limit renaming applies). */
export const MAX_PROJECT_NAME = 60;

/**
 * "Acme (version 3 May)" for a project started from a version, kept within the name limit and unique
 * among `taken`: a second one on the same day becomes "Acme (version 3 May) 2". A long base name is
 * shortened, never the label, so the version stays identifiable.
 */
export function versionProjectName(base: string, label: string, taken: ReadonlySet<string>): string {
  const suffix = ` (${label})`;
  const room = Math.max(1, MAX_PROJECT_NAME - suffix.length);
  const trimmed = base.trim();
  const head = trimmed.length > room ? `${trimmed.slice(0, Math.max(1, room - 1)).trimEnd()}…` : trimmed;
  const first = `${head}${suffix}`.slice(0, MAX_PROJECT_NAME);
  let name = first;
  for (let n = 2; taken.has(name); n += 1) {
    const counter = ` ${n}`;
    name = `${first.slice(0, MAX_PROJECT_NAME - counter.length)}${counter}`;
  }
  return name;
}
