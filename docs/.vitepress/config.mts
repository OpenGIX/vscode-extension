import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OpenGIX / VSCode IDE",
  description:
    "A VSCode extension based on the [Open GIS IDE] for working with geospactial data.",

  cleanUrls: true,

  head: [
    [
      "link",
      {
        rel: "icon",
        href: "https://raw.githubusercontent.com/OpenGIX/opengix.github.io/refs/heads/main/docs/public/favicon.ico",
      },
    ],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "https://github.com/OpenGIX/opengix.github.io/blob/main/docs/public/images/logo-bg.png?raw=true",
    nav: [
      { text: "OpenGIX", link: "https://opengix.org" },

      { text: "Docs", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
