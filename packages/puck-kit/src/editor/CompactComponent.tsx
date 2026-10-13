import { ReactNode } from "react";
import styles from "./CompactComponent.module.css";
import { createUsePuck } from "@puckeditor/core";
import { DynamicIcon } from "lucide-react/dynamic";

const usePuck = createUsePuck();

export function CompactComponentDrawer({ children }: { children: ReactNode }) {
  return <div className={styles.CompactComponent}>{children}</div>;
}

export function CompactComponentItem({
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  const config = usePuck((s) => s.config.components[name]);

  const icon = config.metadata?.icon ?? "component";

  return (
    <div className={styles.CompactComponentItem}>
      <div className={styles.CompactComponentItemCard}>
        <DynamicIcon name={icon} size={32} strokeWidth={1} />
      </div>
      <div className={styles.CompactComponentItemLabel}>{config.label}</div>
    </div>
  );
}
