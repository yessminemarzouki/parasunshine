import { defineReactSsgConfig } from "vite-plugin-react-ssg";

export default defineReactSsgConfig({
  history: "browser",
  origin: "https://www.parasunshine.tn",
  paths: ["/"],
});
