"use client";

import { PageTransition } from "./PageTransition";
import { type ReactNode } from "react";

export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
