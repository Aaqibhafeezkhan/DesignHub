"use client";

import type { CSSProperties } from "react";

import { useBrandTokens } from "@/hooks/use-brand";
import { brandSurface } from "@/lib/brand/theme";
import { fontStack } from "@/lib/typography/css";
import { scaleSize, type PairLayout } from "@/lib/typography/pair-layouts";
import type { FontCategory } from "@/types/typography";

type LayoutProps = {
  headingName: string;
  bodyName: string;
  headingCategory?: FontCategory;
  bodyCategory?: FontCategory;
};

/**
 * A font pair set in a realistic layout. Sizes come from the brand's live type scale and colors
 * from the brand's light surface, so the preview matches what the brand tokens export. The fonts
 * are the ones the pairing studio already loaded, so switching layouts requests nothing.
 */
export function PairLayoutPreview({ layout, ...fonts }: LayoutProps & { layout: PairLayout }) {
  const brand = useBrandTokens();
  const surface = brandSurface(brand, "light");
  const { scale, headingWeight, headingLineHeight, bodyLineHeight } = brand.typography;
  const size = (name: string, fallback: string) => scaleSize(scale, name, fallback);
  const heading: CSSProperties = {
    fontFamily: fontStack(fonts.headingName, fonts.headingCategory),
    fontWeight: headingWeight,
    lineHeight: headingLineHeight,
    overflowWrap: "anywhere",
    margin: 0,
  };
  const body: CSSProperties = {
    fontFamily: fontStack(fonts.bodyName, fonts.bodyCategory),
    lineHeight: bodyLineHeight,
    overflowWrap: "anywhere",
    margin: 0,
  };
  const frame: CSSProperties = { background: surface.background, color: surface.text, borderColor: surface.border };
  const props = { surface, heading, body, size };

  return (
    <div className="min-w-0 rounded-lg border p-5 md:p-10" style={frame} data-pair-layout={layout}>
      {layout === "article" ? (
        <Article {...props} />
      ) : layout === "pricing" ? (
        <Pricing {...props} />
      ) : (
        <Hero {...props} />
      )}
    </div>
  );
}

type Parts = {
  surface: ReturnType<typeof brandSurface>;
  heading: CSSProperties;
  body: CSSProperties;
  size: (name: string, fallback: string) => string;
};

function Article({ surface, heading, body, size }: Parts) {
  return (
    <article className="flex max-w-3xl flex-col gap-5">
      <p
        style={{
          ...body,
          color: surface.primaryText,
          fontSize: size("sm", "0.875rem"),
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Field notes · Issue 04
      </p>
      <h2 style={{ ...heading, fontSize: size("5xl", "3rem"), letterSpacing: "-0.02em" }}>
        Good typography is invisible until it isn’t.
      </h2>
      <p style={{ ...body, fontSize: size("lg", "1.125rem"), color: surface.muted }}>By Jordan Lee · 6 min read</p>
      <p style={{ ...body, fontSize: size("base", "1rem") }}>
        Type sets the tone before a single word is read. A confident headline paired with a patient, readable text face
        gives every page a clear voice and a comfortable rhythm.
      </p>
      <h3 style={{ ...heading, fontSize: size("2xl", "1.5rem") }}>Contrast is the secret</h3>
      <p style={{ ...body, fontSize: size("base", "1rem") }}>
        Pair a serif with a sans, a wide face with a narrow one, or a display font with a quiet workhorse. Keep the
        x-heights close and the moods complementary.
      </p>
    </article>
  );
}

function Pricing({ surface, heading, body, size }: Parts) {
  const features = ["Unlimited projects", "Brand kit and exports", "Priority support"];
  return (
    <div
      className="mx-auto flex max-w-sm min-w-0 flex-col gap-4 rounded-xl border p-6"
      style={{ background: surface.surface, borderColor: surface.border }}
    >
      <p style={{ ...body, fontSize: size("sm", "0.875rem"), color: surface.primaryText, fontWeight: 600 }}>
        Most popular
      </p>
      <h2 style={{ ...heading, fontSize: size("2xl", "1.5rem") }}>Studio plan</h2>
      <p
        style={{
          ...heading,
          fontSize: size("5xl", "3rem"),
          display: "flex",
          alignItems: "baseline",
          gap: "0.35rem",
          flexWrap: "wrap",
        }}
      >
        $24
        <span style={{ ...body, fontSize: size("sm", "0.875rem"), color: surface.muted }}>per month</span>
      </p>
      <p style={{ ...body, fontSize: size("base", "1rem"), color: surface.muted }}>
        Everything a small team needs to ship a consistent brand.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {features.map((feature) => (
          <li key={feature} style={{ ...body, fontSize: size("base", "1rem") }}>
            <span aria-hidden style={{ color: surface.primaryText, marginRight: "0.5rem" }}>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <span
        style={{
          ...body,
          fontSize: size("base", "1rem"),
          fontWeight: 600,
          background: surface.primary,
          color: surface.onPrimary,
          borderRadius: "0.5rem",
          padding: "0.65rem 1rem",
          textAlign: "center",
        }}
      >
        Start free trial
      </span>
    </div>
  );
}

function Hero({ surface, heading, body, size }: Parts) {
  return (
    <section className="flex min-w-0 flex-col items-start gap-5 py-4 md:py-10">
      <p
        style={{
          ...body,
          fontSize: size("sm", "0.875rem"),
          border: `1px solid ${surface.border}`,
          borderRadius: "999px",
          padding: "0.2rem 0.75rem",
          color: surface.muted,
        }}
      >
        New · Version 2.0 is here
      </p>
      <h2 style={{ ...heading, fontSize: size("5xl", "3rem"), letterSpacing: "-0.03em", maxWidth: "18ch" }}>
        Make something people remember.
      </h2>
      <p style={{ ...body, fontSize: size("lg", "1.125rem"), color: surface.muted, maxWidth: "46ch" }}>
        One calm place to design, review and ship your brand, from the first sketch to the final export.
      </p>
      <div className="flex flex-wrap gap-3">
        <span
          style={{
            ...body,
            fontSize: size("base", "1rem"),
            fontWeight: 600,
            background: surface.primary,
            color: surface.onPrimary,
            borderRadius: "0.5rem",
            padding: "0.65rem 1.1rem",
          }}
        >
          Get started
        </span>
        <span
          style={{
            ...body,
            fontSize: size("base", "1rem"),
            fontWeight: 600,
            border: `1px solid ${surface.border}`,
            borderRadius: "0.5rem",
            padding: "0.65rem 1.1rem",
          }}
        >
          See how it works
        </span>
      </div>
    </section>
  );
}
