import { createBuilderConfig } from "puck-kit";
import { Image } from "./Image";

export const config = createBuilderConfig({
  components: { Image },
  categories: { media: { title: "Media", components: ["Image"] } },
});
