// Fallback typing for `tsc`. In the editor, typescript-plugin-css-modules provides the exact class names.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
