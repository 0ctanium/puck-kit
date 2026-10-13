import { createBuilderConfig } from "puck-kit";
import { Banner } from "./Banner";

export const config = createBuilderConfig({
  components: { Banner },
  categories: {
    examples: { title: "Examples", components: ["Banner"] },
  },
});
