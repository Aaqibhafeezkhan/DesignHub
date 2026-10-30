/** Selecting several projects at once. Pure helpers, so the rules are tested without a page. */

/** The ids with `id` added or taken out. */
export function toggled(selection: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selection);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Everything in `visible` is selected, or nothing is when everything already was (select all toggles). */
export function toggledAll(selection: ReadonlySet<string>, visible: readonly string[]): Set<string> {
  const all = visible.length > 0 && visible.every((id) => selection.has(id));
  return all ? new Set() : new Set(visible);
}

/** The selection without ids that no longer exist, so a deleted project cannot stay selected. */
export function pruned(selection: ReadonlySet<string>, existing: readonly string[]): Set<string> {
  const present = new Set(existing);
  return new Set([...selection].filter((id) => present.has(id)));
}

/**
 * What a bulk delete may remove: every selected project except the open one, which is kept so the open brand is
 * never deleted by accident. `keptOpen` says whether it was in the selection.
 */
export function deletable(
  selection: ReadonlySet<string>,
  activeId: string | null,
): { ids: string[]; keptOpen: boolean } {
  const ids = [...selection].filter((id) => id !== activeId);
  return { ids, keptOpen: activeId !== null && selection.has(activeId) };
}
