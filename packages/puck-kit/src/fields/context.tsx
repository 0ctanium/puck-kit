"use client";

import { createContext, useContext } from "react";
import type { Breakpoint } from "../breakpoints";
import type { Tokens } from "../styles/tokens";
import type { StyleProp, Styles } from "../styles/types";

export type PropState = "set" | "inherited" | "empty";

export interface PropRead {
  /** Value set at the active breakpoint. */
  value: string | undefined;
  /** Value inherited from a smaller breakpoint, when nothing is set here. */
  inherited: string | undefined;
  /** Breakpoint label the effective value comes from. */
  from: string | undefined;
  state: PropState;
}

export interface PanelApi {
  styles: Styles;
  breakpoints: Breakpoint[];
  active: Breakpoint;
  tokens: Tokens;
  readOnly: boolean;
  /**
   * Layout of the element's parent at the active breakpoint, when the parent is a styled
   * kit container (null at the page root or inside slots that aren't the parent's main box).
   */
  parent: { display?: string; flexDirection?: string } | null;
  read: (prop: StyleProp) => PropRead;
  /** Effective value at the active breakpoint (own or inherited). */
  get: (prop: StyleProp) => string | undefined;
  write: (prop: StyleProp, value: string | undefined) => void;
  /** Several properties in one change (one undo step). */
  writeMany: (values: Partial<Record<StyleProp, string | undefined>>) => void;
}

const PanelContext = createContext<PanelApi | null>(null);

export const PanelProvider = PanelContext.Provider;

export function usePanel(): PanelApi {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used inside <StylePanel>");
  return ctx;
}

/** Combined state of several properties: set if any is set here, else inherited if any is inherited. */
export function stateOf(reads: PropRead[]): PropState {
  if (reads.some((r) => r.state === "set")) return "set";
  if (reads.some((r) => r.state === "inherited")) return "inherited";
  return "empty";
}
