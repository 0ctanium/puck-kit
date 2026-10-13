// Example component using the kit's field types (color, background, font, range, checkbox) and
// the restyled `select`. Values are plain CSS strings/numbers, so rendering is just inline styles.
import type { ComponentConfig } from "@puckeditor/core";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { backgroundStyle, iconOptions, type BackgroundValue, type KitFields } from "puck-kit";

export interface BannerProps {
  title: string;
  text: string;
  background: BackgroundValue;
  textColor: string;
  font: string;
  align: "left" | "center" | "right";
  padding: number;
  radius: number;
  showButton: boolean;
  buttonLabel: string;
  buttonColor: string;
}

export const Banner: ComponentConfig<{ props: BannerProps; fields: KitFields }> = {
  label: "Promo Banner",
  inline: true,
  fields: {
    title: { type: "text", label: "Title" },
    text: { type: "textarea", label: "Text" },
    background: { type: "background", label: "Background" },
    textColor: { type: "color", label: "Text color" },
    font: { type: "font", label: "Title font" },
    align: {
      type: "select",
      label: "Alignment",
      options: iconOptions([
        { label: "Left", value: "left", icon: <AlignLeft size={14} /> },
        { label: "Center", value: "center", icon: <AlignCenter size={14} /> },
        { label: "Right", value: "right", icon: <AlignRight size={14} /> },
      ]),
    },
    padding: { type: "range", label: "Padding", min: 0, max: 128, step: 4, unit: "px" },
    radius: { type: "range", label: "Corner radius", min: 0, max: 48, unit: "px" },
    showButton: { type: "checkbox", label: "Button", text: "Show a button" },
    buttonLabel: { type: "text", label: "Button label" },
    buttonColor: { type: "color", label: "Button color" },
  },
  // Hide the button settings when the button is off.
  resolveFields: (data, { fields }) => {
    if (data.props.showButton) return fields;
    const { buttonLabel: _l, buttonColor: _c, ...rest } = fields;
    return rest as typeof fields;
  },
  defaultProps: {
    title: "Ship faster with design tokens",
    text: "Every color, font and size here comes from the page's tokens — change them once in the Tokens panel.",
    background: {
      color: "var(--pk-color-primary)",
      image: "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%)",
      size: "auto",
      position: "0% 0%",
      repeat: "repeat",
    },
    textColor: "var(--pk-color-white)",
    font: "var(--pk-font-serif)",
    align: "center",
    padding: 56,
    radius: 16,
    showButton: true,
    buttonLabel: "Get started",
    buttonColor: "var(--pk-color-text)",
  },
  render: ({ puck, title, text, background, textColor, font, align, padding, radius, showButton, buttonLabel, buttonColor }) => (
    <section
      ref={puck.dragRef}
      style={{
        ...backgroundStyle(background),
        color: textColor || undefined,
        textAlign: align,
        padding,
        borderRadius: radius,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        gap: 16,
      }}
    >
      <h2 style={{ fontFamily: font || undefined, fontSize: 36, lineHeight: 1.15, margin: 0 }}>{title}</h2>
      <p style={{ margin: 0, maxWidth: 560, opacity: 0.9 }}>{text}</p>
      {showButton && (
        <a
          href="#"
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: buttonColor || "#111827",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {buttonLabel}
        </a>
      )}
    </section>
  ),
};
