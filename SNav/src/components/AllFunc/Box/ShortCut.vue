<template>
  <!-- 捷径 -->
  <div class="shortcut__layout">
    <n-scrollbar class="scrollbar">
      <!-- 按分类渲染，可折叠 -->
      <div v-for="cat in site.categories" :key="cat" class="cat-block">
        <div class="cat-head" @click="toggle(cat)">
          <SvgIcon :iconName="collapsed[cat] ? 'icon-unfold' : 'icon-packup'" />
          <span class="cat-name">{{ cat }}</span>
          <span class="cat-count">{{ grouped[cat]?.length || 0 }}</span>
        </div>
        <n-grid
          v-show="!collapsed[cat]"
          class="all-shortcut"
          responsive="screen"
          cols="2 s:3 m:4 l:5"
          :x-gap="10"
          :y-gap="10"
        >
          <n-grid-item
            v-for="item in grouped[cat] || []"
            :key="item.id"
            class="shortcut-item"
            @contextmenu="shortCutContextmenu($event, item)"
            @click="shortCutJump(item.url)"
          >
            <span class="name">{{ item.name }}</span>
          </n-grid-item>
        </n-grid>
      </div>
      <!-- 添加捷径 -->
      <n-grid
        class="all-shortcut add-row"
        responsive="screen"
        cols="2 s:3 m:4 l:5"
        :x-gap="10"
        :y-gap="10"
      >
        <n-grid-item class="shortcut-item" @click="addShortcutModalOpen">
          <SvgIcon iconName="icon-add" />
          <span class="name">添加捷径</span>
        </n-grid-item>
      </n-grid>
    </n-scrollbar>

    <!-- 添加 / 编辑捷径弹窗 -->
    <n-modal
      preset="card"
      v-model:show="addShortcutModalShow"
      :title="`${addShortcutModalType ? '编辑' : '添加'}捷径`"
      :bordered="false"
      @mask-click="addShortcutClose"
    >
      <n-form ref="addShortcutRef" :rules="addShortcutRules" :model="addShortcutValue" :label-width="80">
        <n-form-item label="名称" path="name">
          <n-input clearable show-count maxlength="14" v-model:value="addShortcutValue.name" placeholder="请输入捷径名称" />
        </n-form-item>
        <n-form-item label="链接" path="url">
          <n-input clearable v-model:value="addShortcutValue.url" placeholder="https://" />
        </n-form-item>
        <n-form-item label="分类" path="category">
          <n-select
            v-model:value="addShortcutValue.category"
            :options="catOptions"
            filterable
            tag
            placeholder="选择或输入新分类"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button strong secondary @click="addShortcutClose">取消</n-button>
          <n-button strong secondary @click="addOrEditShortcuts">{{ addShortcutModalType ? "编辑" : "添加" }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 右键菜单 -->
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      size="large"
      :x="shortCutDropdownX"
      :y="shortCutDropdownY"
      :options="shortCutDropdownOptions"
      :show="shortCutDropdownShow"
      :on-clickoutside="() => (shortCutDropdownShow = false)"
      @select="shortCutDropdownSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, h } from "vue";
import {
  NButton, NScrollbar, NGrid, NGridItem, NSpace, NModal, NForm,
  NFormItem, NInput, NSelect, NDropdown,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { siteStore } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import identifyInput from "@/utils/identifyInput";

const site = siteStore();
const { shortcutsData, categoriesData, groupedShortcuts } = storeToRefs(site);
const grouped = groupedShortcuts;

const collapsed = reactive({});
const catOptions = computed(() => categoriesData.value.map((c) => ({ label: c, value: c })));

const toggle = (cat) => {
  collapsed[cat] = !collapsed[cat];
};

const renderIcon = (icon) => () => h(SvgIcon, { iconName: `icon-${icon}` }, null);

// 添加捷径
const addShortcutRef = ref(null);
const addShortcutModalShow = ref(false);
const addShortcutModalType = ref(false);
const addShortcutValue = ref({ id: null, name: "", url: "", category: categories.value[0] || "常用" });
const addShortcutRules = {
  name: { required: true, message: "请输入名称", trigger: ["input", "blur"] },
  url: {
    required: true,
    validator(rule, value) {
      if (!value) return new Error("请输入站点链接");
      if (identifyInput(value) !== "url") return new Error("请检查是否为正确的网址");
      return true;
    },
    trigger: ["input", "blur"],
  },
  category: { required: true, message: "请选择分类", trigger: ["blur"] },
};

const shortCutDropdownX = ref(0);
const shortCutDropdownY = ref(0);
const shortCutDropdownShow = ref(false);
const shortCutDropdownOptions = [
  { label: "编辑", key: "edit", icon: renderIcon("edit") },
  { label: "删除", key: "delete", icon: renderIcon("delete-1") },
];

const addShortcutClose = () => {
  addShortcutModalShow.value = false;
  addShortcutValue.value = { id: null, name: "", url: "", category: categories.value[0] || "常用" };
};

const addShortcutModalOpen = () => {
  const maxId = shortcutsData.value.reduce((m, i) => (i.id > m ? i.id : m), -1);
  addShortcutValue.value = { id: maxId + 1, name: "", url: "", category: categoriesData.value[0] || "常用" };
  addShortcutModalType.value = false;
  addShortcutModalShow.value = true;
};

const addOrEditShortcuts = () => {
  addShortcutRef.value?.validate((errors) => {
    if (errors) {
      $message.error("请检查您的输入");
      return;
    }
    const v = addShortcutValue.value;
    if (!categoriesData.value.includes(v.category)) {
      categoriesData.value.push(v.category);
    }
    if (!addShortcutModalType.value) {
      const dup = shortcutsData.value.some((i) => i.name === v.name || i.url === v.url);
      if (dup) {
        $message.error("名称或链接已存在");
        return;
      }
      shortcutsData.value.push({ id: v.id, name: v.name, url: v.url, category: v.category });
      $message.success("捷径添加成功");
    } else {
      const idx = shortcutsData.value.findIndex((i) => i.id === v.id);
      if (idx === -1) {
        $message.error("未找到该项");
        return;
      }
      shortcutsData.value[idx] = { ...shortcutsData.value[idx], name: v.name, url: v.url, category: v.category };
      $message.success("捷径编辑成功");
    }
    addShortcutClose();
  });
};

const delShortcuts = () => {
  const id = addShortcutValue.value.id;
  const idx = shortcutsData.value.findIndex((i) => i.id === id);
  if (idx !== -1) {
    shortcutsData.value.splice(idx, 1);
    $message.success("捷径删除成功");
  }
};

const shortCutContextmenu = (e, data) => {
  e.preventDefault();
  shortCutDropdownShow.value = false;
  addShortcutValue.value = { ...data };
  if (!addShortcutValue.value.category) addShortcutValue.value.category = categoriesData.value[0] || "常用";
  setTimeout(() => {
    shortCutDropdownShow.value = true;
    shortCutDropdownX.value = e.clientX;
    shortCutDropdownY.value = e.clientY;
  }, 0);
};

const shortCutDropdownSelect = (key) => {
  shortCutDropdownShow.value = false;
  if (key === "edit") {
    addShortcutModalType.value = true;
    addShortcutModalShow.value = true;
  } else if (key === "delete") {
    $dialog.warning({
      title: "删除捷径",
      content: `确认删除 ${addShortcutValue.value.name}？`,
      positiveText: "删除",
      negativeText: "取消",
      onPositiveClick: delShortcuts,
    });
  }
};

const shortCutJump = (url) => {
  const urlFormat = /^(https?:\/\/)/i.test(url) ? url : `//${url}`;
  if (set.urlJumpType === "href") window.location.href = urlFormat;
  else window.open(urlFormat, "_blank");
};

import { setStore } from "@/stores";
const set = setStore();
</script>

<style lang="scss" scoped>
.shortcut__layout {
  width: 100%;
  height: 100%;
  .cat-block {
    margin-bottom: 6px;
    .cat-head {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      cursor: pointer;
      font-size: 14px;
      opacity: 0.85;
      user-select: none;
      &:hover { opacity: 1; }
      .cat-name { font-weight: 600; }
      .cat-count {
        margin-left: auto;
        font-size: 12px;
        opacity: 0.6;
      }
    }
    .all-shortcut { padding: 0 20px 8px; }
  }
  .add-row { padding: 0 20px; }
  .shortcut-item {
    cursor: pointer;
    height: 56px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--main-background-light-color);
    border-radius: 8px;
    font-size: 16px;
    transition: background-color 0.2s, box-shadow 0.2s;
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &:hover {
      background-color: var(--main-background-hover-color);
    }
  }
}
</style>
