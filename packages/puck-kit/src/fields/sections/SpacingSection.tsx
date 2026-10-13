"use client";

import { Scan } from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { BoxValue, SIDES } from "./BoxModel";
import { Section } from "./Section";
import s from "./sections.module.css";

const MARGIN: StyleProp[] = ["marginTop", "marginRight", "marginBottom", "marginLeft"];
const PADDING: StyleProp[] = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];

export function SpacingSection() {
  return (
    <Section id="spacing" title="Spacing" icon={<Scan size={14} />} props={[...MARGIN, ...PADDING]} defaultOpen>
      <div className={`${s.box} ${s.boxMargin}`}>
        <span className={s.boxTag}>Margin</span>
        {SIDES.map((side, i) => (
          <BoxValue key={side} prop={MARGIN[i]} side={side} group={MARGIN} keywords={["auto"]} allowNegative />
        ))}
        <div className={`${s.box} ${s.boxPadding}`}>
          <span className={s.boxTag}>Padding</span>
          {SIDES.map((side, i) => (
            <BoxValue key={side} prop={PADDING[i]} side={side} group={PADDING} />
          ))}
          <div className={s.boxCenter} />
        </div>
      </div>
    </Section>
  );
}
