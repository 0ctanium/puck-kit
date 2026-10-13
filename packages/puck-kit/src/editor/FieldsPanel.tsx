"use client";

import { createUsePuck } from "@puckeditor/core";
import React, { Activity, Children, ReactNode, useState } from "react";
import styles from "./FieldsPanel.module.css";
import { cx } from "../components/shared";

const usePuck = createUsePuck();

export function FieldsPanel({
  children,
}: {
  children: ReactNode;
  isLoading: boolean;
  itemSelector?: {
    index: number;
    zone?: string;
  } | null;
}) {
  const [selected, setSelected] = useState("Settings");

  const fieldsConfig = usePuck((s) => {
    const selectedType = s.selectedItem?.type;

    if (!selectedType) {
      return s.config.root?.fields;
    }

    return s.config.components[selectedType]?.fields;
  });

  if (!fieldsConfig) return <div className={styles.KitFields}>{children}</div>;

  const categories: Record<string, React.ReactNode[]> = {};

  Children.forEach(children, (child) => {
    if (!React.isValidElement<{ fieldName: string }>(child)) return;

    const config = fieldsConfig[child.props.fieldName];

    const category = config?.metadata?.category ?? "Settings";

    if (!categories[category]) categories[category] = [];
    categories[category].push(child);
  });

  return (
    <div className={styles.KitFields}>
      <div className={styles.KitFieldsTab}>
        {Object.keys(categories).map((category) => {
          return (
            <button
              key={category}
              className={cx(
                styles.KitFieldsTabButton,
                selected === category && styles.KitFieldsTabButtonActive,
              )}
              onClick={() => setSelected(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
      {Object.entries(categories).map(([category, childNodes]) => (
        <Activity
          mode={selected === category ? "visible" : "hidden"}
          key={category}
        >
          {childNodes}
        </Activity>
      ))}
    </div>
  );
}
