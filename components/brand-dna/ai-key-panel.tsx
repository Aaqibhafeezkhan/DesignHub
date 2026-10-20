"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cleanAiKey, loadAiKey, removeAiKey, saveAiKey, type StoredAiKey } from "@/lib/brand-dna/ai-key";
import { AI_API_NAME, aiRequestPreview } from "@/lib/brand-dna/providers/anthropic";
import { sampleToPngBase64 } from "@/lib/brand-dna/providers/encode";
import type { DnaImage } from "@/lib/brand-dna/types";

/**
 * The key and the consent for the AI provider. The key is saved only in this browser's IndexedDB,
 * and the exact images and instructions are shown before the first request is allowed.
 */
export function AiKeyPanel({ images, onChange }: { images: DnaImage[]; onChange: () => void }) {
  const [stored, setStored] = useState<StoredAiKey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;
    void loadAiKey().then((value) => {
      if (!active) return;
      setStored(value);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Exactly what the request carries: the downscaled PNGs and the instructions.
  const preview = useMemo(() => {
    if (!stored || images.length === 0) return null;
    try {
      return aiRequestPreview(images, sampleToPngBase64);
    } catch {
      return null;
    }
  }, [stored, images]);

  async function save() {
    const key = cleanAiKey(draft);
    if (!key) {
      toast.error("That doesn't look like an API key.", { description: "Paste it without spaces or line breaks." });
      return;
    }
    const value = { key, reviewed: false };
    await saveAiKey(value);
    setStored(value);
    setDraft("");
    toast.success("Key saved in this browser");
  }

  async function remove() {
    await removeAiKey();
    setStored(null);
    toast.success("Key removed", { description: "The key and your review were deleted from this browser." });
    onChange();
  }

  async function approve() {
    if (!stored) return;
    const value = { ...stored, reviewed: true };
    await saveAiKey(value);
    setStored(value);
    onChange();
  }

  if (!loaded) return null;
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 text-xs">
      <p className="text-muted-foreground">
        Uses the {AI_API_NAME}. Your key stays in this browser (IndexedDB). It is never added to exports, project files
        or share links, and is sent only to the provider.
      </p>
      {stored ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">
              <KeyRound className="size-3.5" /> Key saved (ends in {stored.key.slice(-4)})
            </span>
            <Button variant="outline" size="sm" onClick={() => void remove()}>
              <Trash2 /> Remove key
            </Button>
          </div>
          {stored.reviewed ? (
            <p className="text-muted-foreground">You have reviewed what is sent. Removing the key resets that.</p>
          ) : (
            <div className="flex flex-col gap-2" role="group" aria-label="What will be sent">
              <p className="font-medium">Before the first request, this is exactly what is sent:</p>
              {preview ? (
                <>
                  <ul className="flex flex-wrap gap-2">
                    {preview.images.map((item, index) => (
                      <li key={index} className="size-16 overflow-hidden rounded border bg-checker">
                        {/* eslint-disable-next-line @next/next/no-img-element -- the downscaled copy that is sent */}
                        <img
                          src={`data:image/png;base64,${item.base64}`}
                          alt={`Downscaled copy of ${item.name}, as sent`}
                          className="size-full object-contain"
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground">
                    Instructions: {preview.prompt} Model: {preview.model}. File names are not sent.
                  </p>
                  <Button size="sm" onClick={() => void approve()}>
                    Send these images when I analyze
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Upload an image to see what would be sent.</p>
              )}
              <p className="text-muted-foreground">
                Until you agree, the on-device result is shown and nothing is sent.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-key">API key</Label>
          <Input
            id="ai-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            placeholder="Paste your key"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button size="sm" onClick={() => void save()} disabled={!draft.trim()}>
            Save key in this browser
          </Button>
        </div>
      )}
    </div>
  );
}
