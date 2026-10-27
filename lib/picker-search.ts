/** The text a picker item can be found by: its label, id, description and any extra words. */
export type SearchableItem = { id: string; label: string; description?: string; keywords?: string };

/** True when every word of the query is in the item's text or its group's name. Case does not matter. */
export function matchesQuery(item: SearchableItem, query: string, groupLabel = ""): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = `${item.label} ${item.id} ${item.description ?? ""} ${item.keywords ?? ""} ${groupLabel}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/** Items that match, group by group; a group with no match is left out. Order is kept. */
export function filterGroups<I extends SearchableItem>(
  groups: { id: string; label: string; items: I[] }[],
  query: string,
): { id: string; label: string; items: I[] }[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => matchesQuery(item, query, group.label)) }))
    .filter((group) => group.items.length > 0);
}
