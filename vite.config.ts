import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) =>
      key.startsWith("VITE_") || key.startsWith("NEXT_PUBLIC_")
    )
  );

  return {
    server: {
      host: "::",
      port: 8080,
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    define: {
      "process.env": JSON.stringify(publicEnv),
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
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
  };
});
