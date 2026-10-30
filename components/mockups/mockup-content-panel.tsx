"use client";

import { Moon, Sun } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdvanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MockupContent } from "@/lib/mockups/types";
import { useMockupStore } from "@/store/mockup-store";
import type { BrandMode } from "@/types/brand";

const fields: { key: keyof MockupContent; label: string }[] = [
  { key: "headline", label: "Headline" },
  { key: "cta", label: "Call to action" },
  { key: "person", label: "Name" },
  { key: "role", label: "Title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
];

/** Contact details are Advanced: the headline, the call to action and the person are what most sessions edit. */
const advancedFields: (keyof MockupContent)[] = ["email", "phone", "website", "address"];

export function MockupContentPanel() {
  const advanced = useIsAdvanced();
  const mode = useMockupStore((state) => state.mode);
  const setMode = useMockupStore((state) => state.setMode);
  const content = useMockupStore((state) => state.content);
  const setContent = useMockupStore((state) => state.setContent);

  return (
    <Panel title="Content">
      <div className="flex flex-col gap-2">
        <Label>Theme</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as BrandMode)}
          aria-label="Mockup theme"
          className="w-full"
        >
          <ToggleGroupItem value="light" className="flex-1">
            <Sun /> Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="flex-1">
            <Moon /> Dark
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {fields
        .filter((field) => advanced || !advancedFields.includes(field.key))
        .map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`mockup-${field.key}`}>{field.label}</Label>
            <Input
              id={`mockup-${field.key}`}
              value={content[field.key]}
              maxLength={80}
              placeholder={
                field.key === "headline" || field.key === "email" || field.key === "website"
                  ? "From your brand"
                  : undefined
              }
              onChange={(event) => setContent({ [field.key]: event.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
    </Panel>
  );
}
