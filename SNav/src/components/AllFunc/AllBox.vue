<template>
  <n-tabs class="all-box" size="large" justify-content="space-evenly" animated>
    <n-tab-pane class="no-padding height--full" name="link" tab="捷径">
      <ShortCut />
    </n-tab-pane>
    <n-tab-pane name="note" tab="便签">
      <div class="note-wrap">
        <!-- 状态栏 -->
        <div class="note-bar">
          <n-button size="small" secondary @click="showToken = !showToken">
            {{ token ? "已配置 Token" : "配置 Token" }}
          </n-button>
          <n-button size="small" type="primary" :loading="saving" @click="saveAll">
            保存
          </n-button>
          <span class="status" :class="statusType">{{ statusText }}</span>
        </div>

        <!-- Token 输入 -->
        <n-collapse-transition :show="showToken">
          <div class="token-box">
            <n-input
              type="password"
              v-model:value="tokenInput"
              placeholder="ghp_xxx 或 github_pat_xxx（仅需一次，存本地）"
              @keyup.enter="verifyAndSave"
            />
            <n-button size="small" @click="verifyAndSave">验证并保存</n-button>
          </div>
        </n-collapse-transition>

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
import { ref, onMounted, h } from "vue";
import {
  NTabs, NTabPane, NButton, NInput, NScrollbar, NCollapseTransition,
} from "naive-ui";
import ShortCut from "@/components/AllFunc/Box/ShortCut.vue";
import { siteStore } from "@/stores";
import { fetchData, saveData, getToken, setToken, verifyToken } from "@/api/github";

const site = siteStore();
const notes = ref([]);
const newContent = ref("");
const token = ref(getToken());
const tokenInput = ref("");
const showToken = ref(false);
const saving = ref(false);
const statusText = ref("点击「保存」写入 GitHub");
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

const verifyAndSave = async () => {
  const t = tokenInput.value.trim();
  if (!t) {
    $message.error("请输入 Token");
    return;
  }
  const r = await verifyToken(t);
  if (!r.valid) {
    $message.error("Token 无效：" + r.msg);
    return;
  }
  setToken(t);
  token.value = t;
  $message.success("Token 已保存：" + r.user);
  showToken.value = false;
};

const saveAll = async () => {
  if (!token.value) {
    statusText.value = "请先配置 Token";
    statusType.value = "err";
    showToken.value = true;
    return;
  }
  saving.value = true;
  statusText.value = "保存中…";
  statusType.value = "idle";
  try {
    const payload = site.exportData();
    payload.notes = notes.value;
    await saveData(payload, token.value);
    statusText.value = "已保存到 GitHub ✓";
    statusType.value = "ok";
    $message.success("便签已写入 GitHub");
  } catch (e) {
    statusText.value = "保存失败：" + e.message;
    statusType.value = "err";
    $message.error("保存失败：" + e.message);
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
