"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FontDefinition } from "../fonts/types";

export interface KitEditorOptions {
  /** Fonts users can pick (besides system fonts). Loaded in the editor and on pages using them. */
  fonts?: FontDefinition[];
  /** Shows "Add fonts" buttons in font pickers; e.g. navigate to your font settings page. */
  onAddFonts?: () => void;
  addFontsLabel?: string;
}

interface KitEditorValue {
  fonts: FontDefinition[];
  onAddFonts?: () => void;
  addFontsLabel: string;
}

const KitEditorContext = createContext<KitEditorValue>({ fonts: [], addFontsLabel: "Add fonts" });

/** Provides the font library to the kit's fields and plugins (done by `BuilderEditor`). */
export function KitEditorProvider({ fonts, onAddFonts, addFontsLabel = "Add fonts", children }: KitEditorOptions & { children: ReactNode }) {
  const value = useMemo(() => ({ fonts: fonts ?? [], onAddFonts, addFontsLabel }), [fonts, onAddFonts, addFontsLabel]);
  return <KitEditorContext.Provider value={value}>{children}</KitEditorContext.Provider>;
}

export function useKitEditor(): KitEditorValue {
  return useContext(KitEditorContext);
}
