import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Боевой адрес сайта для canonical, og:url и og:image — см. .env.example.
  // Без него ссылки остаются относительными: canonical работает, а превью
  // в Telegram и соцсетях может не подтянуть картинку.
  const siteUrl = (loadEnv(mode, ".", "").SITE_URL ?? "").replace(/\/$/, "");

  return {
    plugins: [
      react(),
      {
        name: "site-url",
        buildStart() {
          if (!siteUrl) this.warn("SITE_URL не задан — og:image и canonical будут относительными.");
        },
        // "pre": до разбора ссылок Vite, иначе "%SITE_URL%" в href ломает decodeURI.
        transformIndexHtml: {
          order: "pre",
          handler: (html) => html.replaceAll("%SITE_URL%", siteUrl),
        },
      },
    ],
    build: {
      target: "es2020",
      cssTarget: "chrome87",
    },
  };
});
