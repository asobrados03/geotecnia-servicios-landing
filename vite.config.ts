import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicEnv = Object.fromEntries(
    Object.entries(env).filter(
      ([key]) =>
        key.startsWith("VITE_") ||
        key.startsWith("NEXT_PUBLIC_") ||
        key.startsWith("RECAPTCHA_")
    )
  );

  return {
    server: {
      host: "127.0.0.1",
      port: 8080,
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_", "RECAPTCHA_"],
    define: {
      "process.env": JSON.stringify(publicEnv),
    },
    plugins: [
      react(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@vercel/analytics/react": path.resolve(
          __dirname,
          "./src/lib/vercel-analytics"
        ),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
