<template>
  <n-tabs class="all-box" size="large" justify-content="space-evenly" animated>
    <n-tab-pane class="no-padding height--full" name="link" tab="捷径">
      <ShortCut />
    </n-tab-pane>
    <n-tab-pane name="note" tab="便签">
      <div class="note-wrap">
        <!-- 状态栏 -->
        <div class="note-bar">
          <n-button size="small" secondary disabled>
            自动保存
          </n-button>
          <n-button size="small" type="primary" :loading="saving" @click="saveAll">
            立即同步
          </n-button>
          <span class="status" :class="statusType">{{ statusText }}</span>
        </div>

        <!-- 新便签输入 -->
        <div class="note-input">
          <n-input
            v-model:value="newContent"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="写点什么…回车或点添加"
            @keyup.ctrl.enter="addNote"
          />
          <n-button size="small" type="primary" @click="addNote">添加</n-button>
        </div>

        <!-- 便签列表 -->
        <n-scrollbar class="note-list">
          <div v-if="!notes.length" class="empty">还没有便签</div>
          <div v-for="n in notes" :key="n.id" class="note-item">
            <div class="note-text">{{ n.content }}</div>
            <div class="note-meta">
              <span>{{ formatTime(n.time) }}</span>
              <n-button text size="tiny" type="error" @click="del(n.id)">删除</n-button>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </n-tab-pane>
    <n-tab-pane name="more" tab="待办">还能有啥呢 😢</n-tab-pane>
  </n-tabs>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  NTabs, NTabPane, NButton, NInput, NScrollbar,
} from "naive-ui";
import ShortCut from "@/components/AllFunc/Box/ShortCut.vue";
import { siteStore } from "@/stores";
import { fetchData } from "@/api/github";

const site = siteStore();
const notes = ref([]);
const newContent = ref("");
const saving = ref(false);
const statusText = ref("改动将自动保存");
const statusType = ref("idle");

onMounted(async () => {
  // 启动时拉取线上数据，云端优先
  try {
    const { data } = await fetchData();
    if (data) {
      site.hydrate(data);
      notes.value = data.notes || [];
      statusText.value = "已从 GitHub 同步";
      statusType.value = "ok";
    } else {
      notes.value = site.notesData;
    }
  } catch (e) {
    notes.value = site.notesData;
    statusText.value = "拉取失败，使用本地";
    statusType.value = "err";
  }
});

// 监听 store 变化同步到本地 ref（删除后）
const syncNotes = () => {
  notes.value = site.notesData;
};
site.$subscribe(syncNotes);

const addNote = () => {
  const c = newContent.value.trim();
  if (!c) return;
  site.addNote(c);
  newContent.value = "";
};

const del = (id) => {
  site.delNote(id);
};

// 手动「立即同步」= 马上写一次 GitHub（日常改动已自动 debounce 保存）
const saveAll = async () => {
  saving.value = true;
  statusText.value = "同步中…";
  statusType.value = "idle";
  try {
    await site.flushSave();
    statusText.value = "已保存到 GitHub ✓";
    statusType.value = "ok";
    $message.success("已同步到 GitHub");
  } catch (e) {
    statusText.value = "同步失败：" + e.message;
    statusType.value = "err";
    $message.error("同步失败：" + e.message);
  } finally {
    saving.value = false;
  }
};

const formatTime = (t) => {
  if (!t) return "";
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
</script>

<style lang="scss" scoped>
.all-box { height: 100%; }
.note-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 20px;
  box-sizing: border-box;
  gap: 10px;
  .note-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    .status { font-size: 12px; margin-left: auto; }
    .status.ok { color: #18a058; }
    .status.err { color: #d03050; }
    .status.idle { opacity: 0.7; }
  }
  .token-box {
    display: flex;
    gap: 8px;
  }
  .note-input {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .note-list {
    flex: 1;
    min-height: 0;
    .empty {
      text-align: center;
      opacity: 0.5;
      padding: 30px 0;
    }
    .note-item {
      background-color: var(--main-background-light-color);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      .note-text {
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 14px;
      }
      .note-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
        font-size: 12px;
        opacity: 0.6;
      }
    }
  }
}
</style>
