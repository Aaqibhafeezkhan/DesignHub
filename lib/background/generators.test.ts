import { describe, expect, test } from "vitest";

import { backgroundCss } from "@/lib/background/export";
import { circuitTraces, type GridNode } from "@/lib/background/generators/circuit";
import { halftoneGradient, halftoneStrength } from "@/lib/background/generators/halftone";
import { flowAngle, maxFlowPaths, maxFlowPathPoints, valueNoise } from "@/lib/background/generators/flow-field";
import { maxPackedCircles, packCircles } from "@/lib/background/generators/circle-packing";
import { plaidBands } from "@/lib/background/generators/plaid";
import { concentricArcLayout, maxConcentricArcs } from "@/lib/background/generators/arcs";
import { rhombusTile, type RhombusFace } from "@/lib/background/generators/rhombus";
import { grainGradientLayout, maxGrainStops } from "@/lib/background/generators/grain-gradient";
import { hypotrochoid, maxSpirographPoints } from "@/lib/background/generators/spirograph";
import { maxWaveLinePoints, maxWaveLines } from "@/lib/background/generators/wave-lines";
import { truchetPaths } from "@/lib/background/generators/truchet";
import { triangleSlot } from "@/lib/background/generators/triangles";
import { voronoiCells, type Point } from "@/lib/background/generators/voronoi";
import { createRandom, r1 } from "@/lib/background/random";
import { renderBackgroundSvg } from "@/lib/background/registry";
import { xmlError } from "@/lib/test/xml";
import type { BackgroundKind, BackgroundSettings } from "@/types/background";

const settings = (kind: BackgroundKind, patch: Partial<BackgroundSettings> = {}): BackgroundSettings => ({
  kind,
  seed: 42,
  colors: ["#6366f1", "#ec4899", "#f59e0b"],
  background: "#0b1020",
  density: 50,
  scale: 1,
  rotation: 0,
  width: 1920,
  height: 1080,
  ...patch,
});

const nodeCount = (svg: string) => (svg.match(/<[a-zA-Z]/g) ?? []).length;

describe.each([
  "plus",
  "starfield",
  "voronoi",
  "crosshatch",
  "circuit",
  "halftone",
  "triangles",
  "squiggle",
  "squares",
  "argyle",
  "zigzag",
  "spirograph",
  "truchet",
  "flow-field",
  "plaid",
  "circle-packing",
  "rhombus",
  "wave-lines",
  "arcs",
  "grain-gradient",
] as const)("%s", (kind) => {
  test("the same seed renders the same output", () => {
    for (const patch of [{ seed: 7 }, { seed: 7, rotation: 30, density: 100, scale: 2 }]) {
      expect(renderBackgroundSvg(settings(kind, patch))).toBe(renderBackgroundSvg(settings(kind, patch)));
    }
  });

  test("different seeds render different output", () => {
    expect(renderBackgroundSvg(settings(kind, { seed: 1 }))).not.toBe(renderBackgroundSvg(settings(kind, { seed: 2 })));
  });

  test("exports a CSS rule", () => {
    expect(backgroundCss(settings(kind))).toContain("background-image:");
  });
});

test("squares nest around one center and alternate palette colors", () => {
  const svg = renderBackgroundSvg(settings("squares"));
  const rects = [
    ...svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)" fill="(#\w+)"/g),
  ];
  expect(rects.length).toBeGreaterThan(5);
  const centers = new Set(
    rects.map(([, x, y, w]) => `${Math.round(Number(x) + Number(w) / 2)},${Math.round(Number(y) + Number(w) / 2)}`),
  );
  expect(centers.size).toBe(1);
  // Each square is smaller than the one before it, and neighbors never share a color.
  rects.slice(1).forEach((rect, i) => {
    expect(Number(rect[3])).toBeLessThan(Number(rects[i]![3]));
    expect(rect[5]).not.toBe(rects[i]![5]);
  });
  expect(new Set(rects.map((rect) => rect[5]))).toEqual(new Set(["#6366f1", "#ec4899", "#f59e0b"]));
});

test("squares alternate one color with the canvas", () => {
  const svg = renderBackgroundSvg(settings("squares", { colors: ["#ffffff"] }));
  expect(svg).toContain('fill="#ffffff"');
  expect((svg.match(/fill="#0b1020"/g) ?? []).length).toBeGreaterThan(2);
});

test("argyle uses a seeded pattern with diamonds and dashed stitch lines", () => {
  const svg = renderBackgroundSvg(settings("argyle"));
  expect(svg).toContain("<pattern");
  expect(svg).toContain("stroke-dasharray");
  expect(backgroundCss(settings("argyle"))).toContain("data:image/svg+xml");
});

test("zigzag keeps density on row spacing and scale on amplitude", () => {
  const sparse = renderBackgroundSvg(settings("zigzag", { density: 0 }));
  const dense = renderBackgroundSvg(settings("zigzag", { density: 100 }));
  const small = renderBackgroundSvg(settings("zigzag", { scale: 0.25 }));
  const large = renderBackgroundSvg(settings("zigzag", { scale: 4 }));
  const dimensions = (svg: string) => {
    const match = svg.match(/<pattern\b[^>]*width="([\d.]+)" height="([\d.]+)"/);
    if (!match) throw new Error("Expected a repeating zigzag pattern");
    return { width: Number(match[1]), height: Number(match[2]) };
  };
  const pathData = (svg: string) => {
    const match = svg.match(/<path d="([^"]+)"/);
    if (!match) throw new Error("Expected zigzag path data");
    return match[1];
  };

  expect(sparse).toContain("<pattern");
  expect(nodeCount(sparse)).toBeLessThan(1000);
  expect(dimensions(sparse).height).toBeGreaterThan(dimensions(dense).height);
  expect(dimensions(small)).toEqual(dimensions(large));
  expect(pathData(small)).not.toBe(pathData(large));
  expect(backgroundCss(settings("zigzag"))).toContain("data:image/svg+xml");
});

test("plus draws through a <pattern>", () => {
  expect(renderBackgroundSvg(settings("plus"))).toContain("<pattern");
});

test("squiggle uses a seeded SVG pattern and its CSS export", () => {
  const svg = renderBackgroundSvg(settings("squiggle"));
  expect(svg).toContain("<pattern");
  expect(svg).toContain('stroke-linecap="round"');
  const css = backgroundCss(settings("squiggle"));
  expect(css).toContain("background-image:");
  expect(css).toContain("data:image/svg+xml");
});

test("starfield density controls the star count and stays under 1,500 nodes", () => {
  const sparse = nodeCount(renderBackgroundSvg(settings("starfield", { density: 0 })));
  const dense = nodeCount(renderBackgroundSvg(settings("starfield", { density: 100 })));
  expect(dense).toBeGreaterThan(sparse * 3);
  for (const [width, height] of [
    [1920, 1080],
    [1080, 1920],
    [1600, 900],
  ] as const) {
    expect(nodeCount(renderBackgroundSvg(settings("starfield", { density: 100, width, height })))).toBeLessThan(1500);
  }
});

function polygonArea(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2;
}

test.each([
  [1920, 1080, 140, 1],
  [1920, 1080, 30, 2],
  [1080, 1920, 50, 3],
  [1200, 630, 90, 4],
])("voronoi cells tile a %ix%i canvas with no gaps (cell %i, seed %i)", (width, height, cell, seed) => {
  const random = createRandom(seed);
  const columns = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const sites: Point[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      sites.push([((x + 0.08 + random() * 0.84) * width) / columns, ((y + 0.08 + random() * 0.84) * height) / rows]);
    }
  }
  const cells = voronoiCells(sites, columns, rows, width, height);
  // Each cell is clipped against a subset of the sites, so it can only be too big, never too
  // small. If the areas add up to the canvas exactly, the cells cover it with no gaps or overlaps.
  const total = cells.reduce((sum, { polygon }) => sum + polygonArea(polygon), 0);
  expect(total).toBeCloseTo(width * height, 3);
  expect(cells.every(({ polygon }) => polygon.length >= 3)).toBe(true);
  // Adjacency is symmetric: if A borders B, B borders A.
  cells.forEach(({ neighbors }, index) => {
    for (const neighbor of neighbors) expect(cells[neighbor]!.neighbors).toContain(index);
  });
});

test("voronoi renders the largest density quickly", () => {
  renderBackgroundSvg(settings("voronoi", { density: 100 }));
  // The fastest of five runs, so a busy machine (parallel test files, CI neighbours) does not
  // fail the test. The target is 100 ms on a laptop; leave headroom for slow CI machines.
  const times = [9, 10, 11, 12, 13].map((seed) => {
    const start = performance.now();
    renderBackgroundSvg(settings("voronoi", { density: 100, seed }));
    return performance.now() - start;
  });
  expect(Math.min(...times)).toBeLessThan(250);
});

test("crosshatch draws through a <pattern> and exports two crossing CSS gradients", () => {
  expect(renderBackgroundSvg(settings("crosshatch"))).toContain("<pattern");
  const css = backgroundCss(settings("crosshatch", { rotation: 30 }));
  expect(css).toContain("repeating-linear-gradient(30deg");
  expect(css).toContain("repeating-linear-gradient(120deg");
});

describe("circuit traces", () => {
  const traces = (seed: number) =>
    circuitTraces(createRandom(seed), { columns: 60, rows: 40, coverage: 0.6, maxTraces: 700 });

  test.each([1, 2, 3, 42])("never overlap or cross (seed %i)", (seed) => {
    const nodes = new Set<string>();
    const diagonals = new Set<string>();
    for (const trace of traces(seed)) {
      expect(trace.length).toBeGreaterThanOrEqual(3);
      trace.forEach(([x, y], i) => {
        // No node is used twice, by this trace or any other.
        expect(nodes.has(`${x},${y}`)).toBe(false);
        nodes.add(`${x},${y}`);
        const previous = trace[i - 1];
        if (!previous) return;
        const dx = x - previous[0];
        const dy = y - previous[1];
        expect(Math.max(Math.abs(dx), Math.abs(dy))).toBe(1);
        if (dx && dy) {
          // Two diagonals in one grid cell would cross in an X.
          const cell = `${Math.min(x, previous[0])},${Math.min(y, previous[1])}`;
          expect(diagonals.has(cell)).toBe(false);
          diagonals.add(cell);
        }
      });
    }
  });

  test("turn by at most 45 degrees at a time", () => {
    const angle = (a: GridNode, b: GridNode) => Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (const trace of traces(5)) {
      for (let i = 2; i < trace.length; i += 1) {
        let turn = Math.abs(angle(trace[i - 1]!, trace[i]!) - angle(trace[i - 2]!, trace[i - 1]!));
        if (turn > Math.PI) turn = 2 * Math.PI - turn;
        expect(turn).toBeLessThanOrEqual(Math.PI / 4 + 1e-9);
      }
    }
  });

  test("density adds traces and the SVG stays under 2,500 nodes", () => {
    const sparse = nodeCount(renderBackgroundSvg(settings("circuit", { density: 0 })));
    const dense = nodeCount(renderBackgroundSvg(settings("circuit", { density: 100 })));
    expect(dense).toBeGreaterThan(sparse * 2);
    for (const patch of [
      { density: 100, scale: 0.25 },
      { density: 100, width: 3840, height: 2160, scale: 0.25 },
    ]) {
      expect(nodeCount(renderBackgroundSvg(settings("circuit", patch)))).toBeLessThan(2500);
    }
  });
});

describe("halftone", () => {
  test("dots are largest at a radial gradient's center and fade toward the corners", () => {
    const gradient = { type: "radial", cx: 400, cy: 300, angle: 0 } as const;
    const strength = halftoneStrength(gradient, 1600, 900);
    expect(strength(400, 300)).toBe(1);
    expect(strength(1600, 900)).toBeCloseTo(0, 5);
    expect(strength(800, 300)).toBeLessThan(strength(500, 300));
  });

  test("a linear gradient runs from 0 to 1 across the canvas", () => {
    const strength = halftoneStrength({ type: "linear", cx: 800, cy: 450, angle: 0 }, 1600, 900);
    expect(strength(0, 450)).toBeCloseTo(0, 5);
    expect(strength(800, 0)).toBeCloseTo(0.5, 5);
    expect(strength(1600, 450)).toBeCloseTo(1, 5);
  });

  test("seeds pick both gradient types", () => {
    const types = new Set(
      Array.from({ length: 20 }, (_, seed) => halftoneGradient(settings("halftone", { seed })).type),
    );
    expect(types).toEqual(new Set(["linear", "radial"]));
  });

  test("the gradient option forces the type and keeps the seeded center and angle", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      const seeded = halftoneGradient(settings("halftone", { seed }));
      expect(halftoneGradient(settings("halftone", { seed, options: { halftoneGradient: "seeded" } }))).toEqual(seeded);
      for (const type of ["linear", "radial"] as const) {
        const forced = halftoneGradient(settings("halftone", { seed, options: { halftoneGradient: type } }));
        expect(forced).toEqual({ ...seeded, type });
      }
    }
  });

  test("renders the same output without options as before they existed", () => {
    expect(renderBackgroundSvg(settings("halftone"))).toBe(
      renderBackgroundSvg(settings("halftone", { options: { halftoneGradient: "seeded" } })),
    );
  });

  test("keeps the SVG small, even on a 4K canvas", () => {
    const svg = renderBackgroundSvg(settings("halftone", { density: 100, width: 3840, height: 2160 }));
    expect(nodeCount(svg)).toBeLessThan(20);
    expect((svg.match(/M/g) ?? []).length).toBeLessThan(6600);
  });
});

describe("triangles", () => {
  test("draws through a <pattern>", () => {
    expect(renderBackgroundSvg(settings("triangles"))).toContain("<pattern");
  });

  test.each([2, 3, 4, 5, 6])("no two triangles that share an edge get the same color (%i colors)", (count) => {
    for (let row = 0; row < 6; row += 1) {
      for (let column = -1; column < 12; column += 1) {
        const slot = triangleSlot(column, row, count, 1);
        expect(triangleSlot(column + 1, row, count, 1)).not.toBe(slot);
        expect(triangleSlot(column, row + 1, count, 1)).not.toBe(slot);
      }
    }
  });

  test("density sets the triangle size", () => {
    const tileWidth = (svg: string) => Number(/<pattern[^>]* width="([\d.]+)"/.exec(svg)?.[1]);
    const sparse = tileWidth(renderBackgroundSvg(settings("triangles", { density: 0 })));
    const dense = tileWidth(renderBackgroundSvg(settings("triangles", { density: 100 })));
    expect(sparse).toBeGreaterThan(dense * 3);
  });
});

test("spirograph stays small and bounded at every density", () => {
  for (const density of [0, 50, 100]) {
    const svg = renderBackgroundSvg(settings("spirograph", { density }));
    expect(nodeCount(svg)).toBeLessThan(30);
    expect(svg.length).toBeLessThan(60_000);
    expect(svg).toContain("<pattern");
    for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
      expect((d!.match(/L/g) ?? []).length + 1).toBeLessThanOrEqual(maxSpirographPoints);
    }
  }
});

test("a hypotrochoid is a closed curve inside its radius", () => {
  const d = hypotrochoid(100, 100, 50, [7, 3], 0.8, 0.4);
  const points = d
    .slice(1, -1)
    .split("L")
    .map((pair) => pair.split(" ").map(Number) as [number, number]);
  expect(points.length).toBeGreaterThan(100);
  points.forEach(([x, y]) => expect(Math.hypot(x - 100, y - 100)).toBeLessThanOrEqual(50.2));
});

describe("truchet", () => {
  test("keeps one path per color and stays small at every density", () => {
    for (const density of [0, 50, 100]) {
      for (const scale of [0.5, 1]) {
        const svg = renderBackgroundSvg(settings("truchet", { density, scale }));
        expect(nodeCount(svg)).toBeLessThan(30);
        expect(svg.length).toBeLessThan(80_000);
        expect((svg.match(/<path /g) ?? []).length).toBeLessThanOrEqual(3);
      }
    }
  });

  test("density sets the tile size", () => {
    const tileWidth = (svg: string) => Number(/<pattern[^>]* width="([\d.]+)"/.exec(svg)?.[1]);
    const sparse = tileWidth(renderBackgroundSvg(settings("truchet", { density: 0 })));
    const dense = tileWidth(renderBackgroundSvg(settings("truchet", { density: 100 })));
    expect(sparse).toBeGreaterThan(dense);
  });

  test("every tile draws two arcs between edge midpoints", () => {
    const [path] = truchetPaths(createRandom(3), 4, 40, 1);
    const arcs = path!.match(/M[\d. -]+A/g) ?? [];
    expect(arcs).toHaveLength(32);
    for (const arc of arcs) {
      const [x, y] = arc.slice(1, -1).trim().split(" ").map(Number) as [number, number];
      // Every arc starts at the midpoint of a tile edge.
      expect([x % 40, y % 40].sort()).toEqual([0, 20]);
    }
  });
});

describe("flow field", () => {
  test("value noise is seeded and stays in 0-1", () => {
    expect(valueNoise(3, 1.25, 8.5)).toBe(valueNoise(3, 1.25, 8.5));
    expect(valueNoise(3, 1.25, 8.5)).not.toBe(valueNoise(4, 1.25, 8.5));
    for (let i = 0; i < 200; i += 1) {
      const n = valueNoise(9, i * 0.37, i * 0.91);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(flowAngle(5, 3, 4, 0.01) - flowAngle(5, 3.01, 4, 0.01))).toBeLessThan(0.5);
  });

  test("draws one path per palette color and bounds the curve count", () => {
    const svg = renderBackgroundSvg(settings("flow-field", { density: 100 }));
    expect((svg.match(/<path /g) ?? []).length).toBe(3);
    const d = [...svg.matchAll(/<path d="([^"]+)"/g)].flatMap((match) => match[1]!.split("M").slice(1));
    expect(d.length).toBeLessThanOrEqual(maxFlowPaths);
    d.forEach((curve) => expect(curve.split("L").length).toBeLessThanOrEqual(maxFlowPathPoints));
  });

  test("stays under about 200 kB at the largest density", () => {
    const svg = renderBackgroundSvg(settings("flow-field", { density: 100, width: 3840, height: 2160, scale: 0.25 }));
    expect(svg.length).toBeLessThan(200_000);
  });

  test("density adds curves", () => {
    const paths = (density: number) => renderBackgroundSvg(settings("flow-field", { density })).split("M").length;
    expect(paths(100)).toBeGreaterThan(paths(0));
  });
});

describe("plaid", () => {
  test("bands stay inside the tile so the pattern repeats without a seam", () => {
    const svg = renderBackgroundSvg(settings("plaid", { density: 100, scale: 2 }));
    const tile = svg.match(/<pattern\b[^>]*width="([\d.]+)" height="([\d.]+)"/);
    expect(tile?.[1]).toBe(tile?.[2]);
    const period = Number(tile?.[1]);
    for (const [, x, y, w, h] of svg.matchAll(
      /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#/g,
    )) {
      expect(Number(x) + Number(w)).toBeLessThanOrEqual(period + 0.11);
      expect(Number(y) + Number(h)).toBeLessThanOrEqual(period + 0.11);
    }
  });

  test("draws crossing bands of both directions in palette colors, with a CSS export", () => {
    const svg = renderBackgroundSvg(settings("plaid"));
    expect((svg.match(/fill-opacity="\.45"/g) ?? []).length).toBe(6);
    expect(plaidBands(createRandom(1), 100, ["#fff"])).toHaveLength(3);
    expect(backgroundCss(settings("plaid"))).toContain("data:image/svg+xml");
  });

  test("density sets the repeat size", () => {
    const size = (density: number) =>
      Number(renderBackgroundSvg(settings("plaid", { density })).match(/<pattern\b[^>]*width="([\d.]+)"/)?.[1]);
    expect(size(0)).toBeGreaterThan(size(100));
  });
});

describe("circle packing", () => {
  test("no two circles overlap, and the count and attempts are capped", () => {
    const circles = packCircles(createRandom(3), 1920, 1080, { count: 10_000, maxRadius: 100, minRadius: 3, gap: 2 });
    expect(circles.length).toBeGreaterThan(50);
    expect(circles.length).toBeLessThanOrEqual(maxPackedCircles);
    for (let i = 0; i < circles.length; i += 1) {
      for (let j = i + 1; j < circles.length; j += 1) {
        const a = circles[i]!;
        const b = circles[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
      }
    }
  });

  test("renders circles in the palette and stays under about 200 kB at the largest density", () => {
    const svg = renderBackgroundSvg(settings("circle-packing", { density: 100, width: 3840, height: 2160 }));
    expect(svg).toContain("<circle");
    expect(svg).toMatch(/fill="#(6366f1|ec4899|f59e0b)"/);
    expect(svg.length).toBeLessThan(200_000);
  });

  test("density adds circles", () => {
    const count = (density: number) =>
      (renderBackgroundSvg(settings("circle-packing", { density })).match(/<circle/g) ?? []).length;
    expect(count(100)).toBeGreaterThan(count(0));
  });
});

describe("rhombus", () => {
  const bounds = (face: RhombusFace) => {
    const xs = face.points.map(([x]) => x);
    const ys = face.points.map(([, y]) => y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  };
  // Coordinates are rounded to 0.1 px, so a shifted face matches within a rounding step.
  const sameFace = (a: RhombusFace, b: RhombusFace, dx: number, dy: number) =>
    a.fill === b.fill &&
    a.points.every(
      ([x, y], i) => Math.abs(x + dx - b.points[i]![0]) <= 0.15 && Math.abs(y + dy - b.points[i]![1]) <= 0.15,
    );

  test("the tile repeats seamlessly: every face that crosses an edge is also drawn on the other side", () => {
    for (const radius of [10, 17.3, 40]) {
      const tile = rhombusTile(radius, ["#6366f1", "#ec4899", "#f59e0b"], 42);
      for (const face of tile.faces) {
        for (const dx of [-tile.width, 0, tile.width]) {
          for (const dy of [-tile.height, 0, tile.height]) {
            const { left, right, top, bottom } = bounds(face);
            const touchesTile =
              right + dx > 0.2 && left + dx < tile.width - 0.2 && bottom + dy > 0.2 && top + dy < tile.height - 0.2;
            if (touchesTile) {
              const drawn = tile.faces.some((other) => sameFace(face, other, dx, dy));
              expect(drawn, `${radius}: face at ${face.points[0]} shifted by ${dx},${dy}`).toBe(true);
            }
          }
        }
      }
    }
  });

  test("every cube has three tones, the lightest on top and the darkest on the right", () => {
    const tile = rhombusTile(20, ["#6366f1"], 1);
    expect(new Set(tile.faces.map((face) => face.fill)).size).toBe(3);
    for (let i = 0; i < tile.faces.length; i += 3) {
      const [top, left, right] = tile.faces.slice(i, i + 3).map((face) => face.fill);
      expect(new Set([top, left, right]).size).toBe(3);
    }
  });

  test("the seed picks which palette colors land on the cubes", () => {
    const colors = ["#6366f1", "#ec4899", "#f59e0b"];
    const fills = (seed: number) => rhombusTile(20, colors, seed).faces.map((face) => face.fill);
    expect(fills(1)).toEqual(fills(1));
    expect(fills(1)).not.toEqual(fills(2));
  });

  test("density sets the cube size", () => {
    const small = renderBackgroundSvg(settings("rhombus", { density: 100 }));
    const large = renderBackgroundSvg(settings("rhombus", { density: 0 }));
    const tileWidth = (svg: string) => Number(svg.match(/<pattern\b[^>]*width="([\d.]+)"/)?.[1]);
    expect(tileWidth(large)).toBeGreaterThan(tileWidth(small) * 2);
  });

  test("draws through a <pattern> and exports SVG, rotated SVG and CSS", () => {
    expect(renderBackgroundSvg(settings("rhombus"))).toContain("<pattern");
    expect(renderBackgroundSvg(settings("rhombus", { rotation: 30 }))).toContain("rotate(30");
    expect(backgroundCss(settings("rhombus"))).toContain("data:image/svg+xml");
  });
});

describe("wave lines", () => {
  test("draws parallel palette strokes, with the seed choosing amplitude and phase", () => {
    const svg = renderBackgroundSvg(settings("wave-lines"));
    const paths = svg.match(/<path /g) ?? [];
    expect(paths.length).toBeGreaterThanOrEqual(6);
    expect(paths.length).toBeLessThanOrEqual(maxWaveLines);
    expect(svg).toContain('stroke="#6366f1"');
    expect(svg).toContain('stroke="#ec4899"');
    expect(svg).toContain('stroke="#f59e0b"');
    expect(svg).toContain('fill="none"');
    expect(xmlError(svg)).toBeNull();
    expect(xmlError(renderBackgroundSvg(settings("wave-lines", { rotation: 30 })))).toBeNull();
    for (const curve of svg.match(/<path d="([^"]+)"/g) ?? []) {
      expect(curve.split("C").length - 1).toBeLessThanOrEqual(maxWaveLinePoints - 1);
    }
    expect(renderBackgroundSvg(settings("wave-lines", { seed: 3 }))).not.toBe(
      renderBackgroundSvg(settings("wave-lines", { seed: 9 })),
    );
  });

  test("density adds lines and scale changes the wave size", () => {
    const count = (density: number) =>
      (renderBackgroundSvg(settings("wave-lines", { density })).match(/<path /g) ?? []).length;
    expect(count(100)).toBe(maxWaveLines);
    expect(count(100)).toBeGreaterThan(count(0));
    const pathData = (scale: number) =>
      renderBackgroundSvg(settings("wave-lines", { density: 0, scale })).match(/<path d="([^"]+)"/)?.[1];
    expect(pathData(0.25)).not.toBe(pathData(1));
  });

  test("falls back to one stroke when the palette is empty", () => {
    const svg = renderBackgroundSvg(settings("wave-lines", { colors: [] }));
    expect(svg).toContain('stroke="#ffffff"');
    expect(svg).not.toContain('stroke="#6366f1"');
  });

  test("exports CSS from the SVG and stays under about 200 kB at the largest density", () => {
    const css = backgroundCss(settings("wave-lines"));
    expect(css).toContain("background-image:");
    expect(css).toContain("data:image/svg+xml");
    const svg = renderBackgroundSvg(settings("wave-lines", { density: 100, scale: 4, width: 3840, height: 2160 }));
    expect(svg.length).toBeLessThan(200_000);
    expect((svg.match(/<path /g) ?? []).length).toBeLessThanOrEqual(maxWaveLines);
  });
});

describe("arcs", () => {
  test("draws partial rings that share one center and stop short of a full turn", () => {
    const layout = concentricArcLayout(settings("arcs"));
    expect(layout.sweep).toBeGreaterThan(Math.PI * 0.5);
    expect(layout.sweep).toBeLessThan(Math.PI * 2);
    expect(layout.arcs.length).toBeGreaterThan(3);
    expect(layout.arcs.length).toBeLessThanOrEqual(maxConcentricArcs);
    layout.arcs.slice(1).forEach((arc, index) => {
      expect(arc.radius).toBeGreaterThan(layout.arcs[index]!.radius);
    });

    const svg = renderBackgroundSvg(settings("arcs"));
    expect(svg).not.toContain("<circle");
    expect(svg.match(/<path /g)?.length).toBe(layout.arcs.length);
    const large = layout.sweep > Math.PI ? 1 : 0;
    for (const arc of layout.arcs) {
      expect(svg).toContain(`A${arc.radius} ${arc.radius} 0 ${large} 1`);
      const end = layout.start + layout.sweep;
      const x0 = r1(layout.cx + Math.cos(layout.start) * arc.radius);
      const y0 = r1(layout.cy + Math.sin(layout.start) * arc.radius);
      const x1 = r1(layout.cx + Math.cos(end) * arc.radius);
      const y1 = r1(layout.cy + Math.sin(end) * arc.radius);
      expect(svg).toContain(`M${x0} ${y0}A${arc.radius} ${arc.radius}`);
      expect(x0 !== x1 || y0 !== y1).toBe(true);
    }
  });

  test("cycles the palette, and uses a neutral gray when no colors are set", () => {
    const layout = concentricArcLayout(settings("arcs"));
    expect(new Set(layout.arcs.map((arc) => arc.color))).toEqual(new Set(["#6366f1", "#ec4899", "#f59e0b"]));
    layout.arcs.slice(1).forEach((arc, index) => {
      expect(arc.color).not.toBe(layout.arcs[index]!.color);
    });
    const plain = concentricArcLayout(settings("arcs", { colors: [] }));
    expect(new Set(plain.arcs.map((arc) => arc.color))).toEqual(new Set(["#888888"]));
  });

  test("density adds arcs and scale enlarges the spacing", () => {
    const count = (density: number) => concentricArcLayout(settings("arcs", { density })).arcs.length;
    expect(count(100)).toBeGreaterThan(count(0));
    const radius = (scale: number) => concentricArcLayout(settings("arcs", { scale })).arcs[0]!.radius;
    expect(radius(2)).toBeGreaterThan(radius(1));
  });

  test("the seed moves the center and the opening", () => {
    const first = concentricArcLayout(settings("arcs", { seed: 1 }));
    const second = concentricArcLayout(settings("arcs", { seed: 2 }));
    expect([first.cx, first.cy, first.start, first.sweep]).not.toEqual([
      second.cx,
      second.cy,
      second.start,
      second.sweep,
    ]);
  });

  test("exports rotated SVG and a CSS data URI", () => {
    expect(renderBackgroundSvg(settings("arcs", { rotation: 30 }))).toContain("rotate(30");
    expect(backgroundCss(settings("arcs"))).toContain("data:image/svg+xml");
    const huge = renderBackgroundSvg(settings("arcs", { width: 3840, height: 2160, density: 100 }));
    expect((huge.match(/<path /g) ?? []).length).toBeLessThanOrEqual(maxConcentricArcs);
  });
});

describe("grain-gradient", () => {
  test("uses the seed for the angle and the stop order", () => {
    const layouts = [1, 2, 3, 4].map((seed) => grainGradientLayout(settings("grain-gradient", { seed })));
    expect(new Set(layouts.map((layout) => layout.angle)).size).toBeGreaterThan(1);
    for (const layout of layouts)
      expect([...layout.stops].sort()).toEqual([...settings("grain-gradient").colors].sort());
  });

  test("bounds the stops and adds the canvas color to a single-color palette", () => {
    const many = Array.from({ length: 12 }, (_, i) => `#0000${(i + 10).toString(16)}`);
    expect(grainGradientLayout(settings("grain-gradient", { colors: many })).stops).toHaveLength(maxGrainStops);
    const single = grainGradientLayout(settings("grain-gradient", { colors: ["#ff0000"] })).stops;
    expect([...single].sort()).toEqual(["#0b1020", "#ff0000"]);
  });

  test("draws the grain with feTurbulence and embeds no images", () => {
    const svg = renderBackgroundSvg(settings("grain-gradient"));
    expect(svg).toContain("<feTurbulence");
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("data:");
    expect(svg.length).toBeLessThan(2500);
  });
});
