"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useState } from "react";

type IntentPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

export function IntentPrefetchLink({
  onFocus,
  onMouseEnter,
  ...props
}: IntentPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  return (
    <Link
      {...props}
      prefetch={shouldPrefetch ? null : false}
      onFocus={(event) => {
        setShouldPrefetch(true);
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        setShouldPrefetch(true);
        onMouseEnter?.(event);
      }}
    />
  );
}
