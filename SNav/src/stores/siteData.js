import { defineStore } from "pinia";
import defaultShortCut from "@/assets/defaultShortCut";
import { getToken, saveData } from "@/api/github";

let saveTimer = null;

const useSiteDataStore = defineStore("siteData", {
  state: () => ({
    shortcutsData: [],
    categoriesData: [],
    notesData: [],
    recommendData: [],
  }),
  getters: {
    // 按分类分组
    groupedShortcuts: (state) => {
      const map = {};
      state.categoriesData.forEach((c) => (map[c] = []));
      state.shortcutsData.forEach((s) => {
        const cat = s.category || "其他";
        if (!map[cat]) map[cat] = [];
        map[cat].push(s);
      });
      return map;
    },
    // 兼容旧引用：categories → categoriesData
    categories: (state) => state.categoriesData,
    // 折叠状态：默认全部展开（用分类名做 key）
    collapsedState: () => {
      const saved = localStorage.getItem("snav_collapsed");
      return saved ? JSON.parse(saved) : {};
    },
  },
  actions: {
    // 启动时从云端/打包数据初始化
    // 本地优先：云端只有本地没有的才补，绝不覆盖本地已有数据
    hydrate(data) {
      if (!data) return;
      const merge = (local, remote) => {
        if (!Array.isArray(remote)) return local;
        if (!Array.isArray(local) || local.length === 0) return remote;
        // 本地有数据时，云端只做增量补充
        const localIds = new Set(local.map((x) => x.id));
        return [...local, ...remote.filter((r) => !localIds.has(r.id))];
      };
      this.shortcutsData = merge(this.shortcutsData, data.shortcuts);
      this.categoriesData = [...new Set([...this.categoriesData, ...(data.categories || [])])];
      this.notesData = merge(this.notesData, data.notes);
      this.recommendData = merge(this.recommendData, data.recommend);
    },
    // 导出给 GitHub 写入
    exportData() {
      return {
        shortcuts: this.shortcutsData,
        categories: this.categoriesData,
        notes: this.notesData,
        recommend: this.recommendData,
      };
    },
    // 添加捷径
    addShortcut(payload) {
      this.shortcutsData.push({
        id: Date.now(),
        name: payload.name,
        url: payload.url,
        category: payload.category || this.categoriesData[0] || "其他",
        favorite: false,
      });
    },
    delShortcut(id) {
      this.shortcutsData = this.shortcutsData.filter((s) => s.id !== id);
    },
    // 添加分类
    addCategory(name) {
      if (name && !this.categoriesData.includes(name)) this.categoriesData.push(name);
    },
    // 添加便签
    addNote(content) {
      this.notesData.push({
        id: Date.now(),
        content,
        time: Date.now(),
        color: "",
      });
    },
    delNote(id) {
      this.notesData = this.notesData.filter((n) => n.id !== id);
    },
    // 设置折叠（localStorage 持久化）
    toggleCollapse(cat) {
      const s = this.collapsedState;
      s[cat] = !s[cat];
      localStorage.setItem("snav_collapsed", JSON.stringify(s));
    },
    // 自动保存：任何改动 debounce 写 GitHub
    scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.flushSave(), 2500);
    },
    async flushSave() {
      const tk = getToken();
      if (!tk) return;
      try {
        await saveData(this.exportData(), tk);
        console.log("[SNav] 数据已自动同步到 GitHub");
      } catch (e) {
        console.error("[SNav] 自动同步失败:", e.message);
      }
    },
  },
  // 本地持久化兜底（刷新不丢）
  persist: {
    key: "siteData",
    storage: window.localStorage,
    paths: ["shortcutsData", "categoriesData", "notesData", "recommendData"],
  },
});

export default useSiteDataStore;
