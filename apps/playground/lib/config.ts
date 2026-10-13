import { createBuilderConfig } from "puck-kit";
import { Banner } from "./Banner";
import { Image } from "./Image";

export const config = createBuilderConfig({
  components: { Image, Banner },
  categories: {
    media: { title: "Media", components: ["Image"] },
    examples: { title: "Examples", components: ["Banner"] },
  },
});
