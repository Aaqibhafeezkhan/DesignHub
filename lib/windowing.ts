/** The geometry of a grid of equal square tiles that fill a width, and which of its rows are near a viewport. */
export type GridGeometry = { columns: number; tile: number; rowHeight: number };

export function gridGeometry(width: number, minTile: number, gap: number): GridGeometry {
  if (width <= 0) return { columns: 1, tile: minTile, rowHeight: minTile + gap };
  const columns = Math.max(1, Math.floor((width + gap) / (minTile + gap)));
  const tile = (width - gap * (columns - 1)) / columns;
  return { columns, tile, rowHeight: tile + gap };
}

/**
 * The items to draw: the rows that meet the viewport (a window from `viewTop` to `viewBottom`, measured from
 * the top of the grid) plus `overscan` rows each side, and always the item that has focus. Returns an index
 * range, end exclusive.
 */
export function visibleRange(options: {
  count: number;
  columns: number;
  rowHeight: number;
  viewTop: number;
  viewBottom: number;
  overscan: number;
  keep?: number | null;
}): { start: number; end: number } {
  const { count, columns, rowHeight, viewTop, viewBottom, overscan, keep } = options;
  if (count === 0) return { start: 0, end: 0 };
  const rows = Math.ceil(count / columns);
  let firstRow = Math.max(0, Math.floor(viewTop / rowHeight) - overscan);
  let lastRow = Math.min(rows - 1, Math.floor(viewBottom / rowHeight) + overscan);
  if (keep !== null && keep !== undefined && keep >= 0 && keep < count) {
    const keepRow = Math.floor(keep / columns);
    firstRow = Math.min(firstRow, keepRow);
    lastRow = Math.max(lastRow, keepRow);
  }
  // A viewport entirely above or below the grid still draws the nearest rows, never an empty range.
  firstRow = Math.min(firstRow, rows - 1);
  lastRow = Math.max(lastRow, firstRow);
  return { start: firstRow * columns, end: Math.min(count, (lastRow + 1) * columns) };
}
