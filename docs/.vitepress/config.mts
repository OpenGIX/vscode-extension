import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OpenGIX VS Code IDE",
  description:
    "A VS Code extension based on the [Open GIS IDE] for working with geospactial data.",

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

      { text: "Docs", link: "/getting-started" },
    ],

    sidebar: [
      {
        text: "Usage",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          {
            text: "Features",
            link: "/features",
            items: [
              { text: "Canvas Editor", link: "/features#canvas-editor" },
              {
                text: "Properties Explorer",
                link: "/features#properties-explorer",
              },
              { text: "Integrations", link: "/features#integrations" },
            ],
          },
        ],
      },
      {
        text: "Contributing",
        link: "/contribute",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Workspace Configuration", link: "/markdown-examples" },
          {
            text: "Developer Tour",
            link: "/api-examples",
            items: [
              {
                text: "OpenGIX Panel",
                link: "",
              },
              { text: "Explorer", link: "" },
            ],
          },
          {
            text: "Development",
            link: "/develop",
            items: [
              { text: "Run", link: "/developer#run" },
              { text: "Test", link: "/developer#test" },
              { text: "Build", link: "/developer#build" },
              { text: "Deploy", link: "/developer#deploy" },
            ],
          },
        ],
      },
    ],

    externalLinkIcon: true,

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
