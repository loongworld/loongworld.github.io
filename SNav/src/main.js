import { createApp } from "vue";
// Pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// IconFont
import SvgIcon from "@/components/SvgIcon.vue";
// 主组件
import App from "@/App.vue";
import { siteStore } from "@/stores";
// 全局样式
import "@/style/global.scss";

// 根组件
const app = createApp(App);

// Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 挂载
app.use(pinia);
app.component("SvgIcon", SvgIcon);

// 全局自动保存：siteData 任何改动 debounce 写 GitHub（用户零操作）
const siteData = siteStore();
siteData.$subscribe(() => {
  siteData.scheduleSave();
});

app.mount("#app");
