import { defineStore } from "pinia";
import defaultShortCut from "@/assets/defaultShortCut";

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
    // 折叠状态：默认全部展开（用分类名做 key）
    collapsedState: () => {
      const saved = localStorage.getItem("snav_collapsed");
      return saved ? JSON.parse(saved) : {};
    },
  },
  actions: {
    // 启动时从云端/打包数据初始化
    hydrate(data) {
      if (!data) return;
      this.shortcutsData = data.shortcuts ?? this.shortcutsData;
      this.categoriesData = data.categories ?? this.categoriesData;
      this.notesData = data.notes ?? this.notesData;
      this.recommendData = data.recommend ?? this.recommendData;
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
    // 设置折叠
    toggleCollapse(cat) {
      const s = this.collapsedState;
      s[cat] = !s[cat];
      localStorage.setItem("snav_collapsed", JSON.stringify(s));
    },
  },
});

export default useSiteDataStore;
