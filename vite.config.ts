import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Адрес сайта для canonical, og:url, og:image и JSON-LD. Переопределяется
  // переменной SITE_URL (см. .env.example), по умолчанию — боевой домен.
  const siteUrl = (loadEnv(mode, ".", "").SITE_URL || "https://achimari.top").replace(/\/$/, "");

  return {
    plugins: [
      react(),
      {
        name: "site-url",
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
