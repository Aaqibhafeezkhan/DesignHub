"use client";

import { useI18n } from "@/components/layout/locale-provider";
import type { MessageKey, TranslateArgs } from "@/lib/i18n/translate";

type MessageProps<K extends MessageKey> = { id: K } & (TranslateArgs<K> extends []
  ? { values?: undefined }
  : { values: TranslateArgs<K>[0] });

/**
 * A translated message, for Server Components that can't call `useI18n()` themselves. Messages with
 * `{placeholders}` take their values as `values`.
 */
export function Message<K extends MessageKey>(props: MessageProps<K>) {
  const { t } = useI18n();
  const translate = t as (key: MessageKey, values?: Record<string, string | number>) => string;
  return translate(props.id, props.values);
}
