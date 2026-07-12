import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// 构建日期（Actions build 时注入），用原生 Date 避免额外依赖
const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const buildDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [vue()],
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(buildDate),
  },
  server: {
    port: 5588,
    open: true,
  },
  resolve: {
    // 配置路径别名
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        // 生产环境时移除 console
        pure_funcs: ["console.log"],
      },
    },
  },
});
