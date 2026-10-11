"use client";

import { Check, Copy } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
  value: string;
  label?: string;
  toastMessage?: string;
};

function CopyButton({
  value,
  label,
  toastMessage,
  variant = "ghost",
  size = "icon",
  children,
  ...props
}: CopyButtonProps) {
  const { t } = useI18n();
  const { copy, copied } = useCopy();
  const done = copied === value;

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={children ? undefined : (label ?? t("copy.label"))}
      onClick={() => copy(value, toastMessage)}
      {...props}
    >
      {done ? <Check className="text-success" /> : <Copy />}
      {children}
    </Button>
  );
}

export { CopyButton };
