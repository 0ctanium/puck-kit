/** Minimal base CSS emitted once by the root. Low specificity (:where) so element styles always win. */
export const baseCss = [
  ":where(.pk-page) *,:where(.pk-page) *::before,:where(.pk-page) *::after{box-sizing:border-box}",
  ":where(.pk-page){font-family:var(--pk-font-sans,system-ui,sans-serif);color:var(--pk-color-text,inherit);line-height:1.5}",
  ":where(.pk-page) :where(h1,h2,h3,h4,h5,h6,p,blockquote,ul,ol,figure){margin:0}",
  ":where(.pk-page) :where(img,video){max-width:100%;display:block}",
  ":where(.pk-rich) :where(p,ul,ol,blockquote){margin:0}",
  ":where(.pk-rich) :where(p+p,p+ul,p+ol,ul+p,ol+p){margin-top:.75em}",
  ":where(.pk-rich) :where(ul,ol){padding-left:1.5em}",
  ":where(.pk-rich) a{color:inherit}",
].join("");

/**
 * Editor only. Puck's drop-zone class sets `width:100%;height:100%` on slot elements; since
 * our slots *are* the styled elements, undo that (specificity 0,2,0 beats Puck's 0,1,0, and
 * element styles are emitted at 0,3,0 in the editor so they still win).
 */
export const editorCss = ".pk-slot.pk-slot{width:auto;height:auto}";

/** Base CSS for column wrappers of the Columns component. */
export const columnsCss = ":where(.pk-col){min-width:0}";
