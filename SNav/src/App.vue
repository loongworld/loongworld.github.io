<template>
  <Provider>
    <!-- 管理区密码门禁：仅在 box/set 状态（点时间或右键进入）时校验，首页公开 -->
    <div v-if="needAuth" class="gate">
      <div class="gate-box">
        <div class="gate-title">🔒 管理区，请输入密码</div>
        <n-input
          v-model:value="pwdInput"
          type="password"
          show-password-on="click"
          placeholder="管理密码"
          @keyup.enter="checkPwd"
          :status="pwdErr ? 'error' : ''"
        />
        <n-button type="primary" block :loading="pwdChecking" @click="checkPwd">进入</n-button>
        <div v-if="pwdErr" class="gate-err">密码错误</div>
        <div class="gate-tip">点首页空白处可返回公开页</div>
      </div>
    </div>

    <!-- 壁纸 -->
    <Cover @loadComplete="loadComplete" />
    <!-- 主界面：直接渲染，无 loading、无淡入过渡 -->
    <main
      tabindex="0"
      id="main"
      :class="`main-${status.siteStatus}`"
      :style="{ pointerEvents: mainClickable ? 'auto' : 'none' }"
      @click="status.setSiteStatus('normal')"
      @contextmenu="mainContextmenu"
      @keydown="mainPressKeyboard"
    >
      <WeatherTime />
      <SearchInp @contextmenu.stop />
      <AllFunc @contextmenu.stop />
      <Footer />
      <!-- 状态切换 -->
      <div
        class="all-controls"
        v-show="status.siteStatus !== 'focus' && status.siteStatus !== 'normal'"
      >
        <div
          class="change-status"
          :title="status.mainBoxBig ? '收起' : '展开'"
          @click.stop="status.setMainBoxBig(!status.mainBoxBig)"
        >
          <SvgIcon
            :iconName="`icon-${status.mainBoxBig ? 'packup' : 'unfold'}`"
          />
        </div>
        <div
          class="change-status"
          :title="status.siteStatus !== 'set' ? '设置' : '首页'"
          @click.stop="status.setSiteStatus(status.siteStatus !== 'set' ? 'set' : 'normal')"
        >
          <SvgIcon
            :iconName="`icon-${status.siteStatus !== 'set' ? 'setting' : 'home'}`"
          />
        </div>
      </div>
    </main>
  </Provider>
</template>

<script setup>
import { onMounted, nextTick, watch, ref, computed } from "vue";
import { NInput, NButton } from "naive-ui";
import { statusStore, setStore } from "@/stores";
import { getGreeting } from "@/utils/timeTools";
import Provider from "@/components/Provider.vue";
import Cover from "@/components/Cover.vue";
import WeatherTime from "@/components/WeatherTime.vue";
import SearchInp from "@/components/SearchInput/SearchInp.vue";
import AllFunc from "@/components/AllFunc/AllFunc.vue";
import Footer from "@/components/Footer.vue";

const set = setStore();
const status = statusStore();
const mainClickable = ref(true);

// 管理区密码（前端校验，258888）
// 仅在进入管理区（box/set，即点时间或右键）时校验；首页（normal/focus）公开，不挡
const SITE_PWD = "258888";
const PWD_KEY = "snav_admin_ok";
const authed = ref(localStorage.getItem(PWD_KEY) === "1");
const pwdInput = ref("");
const pwdErr = ref(false);
const pwdChecking = ref(false);
// 需要密码：当前是 box/set 状态 且 还没通过密码
const needAuth = computed(
  () => (status.siteStatus === "box" || status.siteStatus === "set") && !authed.value,
);
const checkPwd = () => {
  if (pwdInput.value === SITE_PWD) {
    localStorage.setItem(PWD_KEY, "1");
    authed.value = true;
    pwdErr.value = false;
  } else {
    pwdErr.value = true;
  }
};

// 获取配置
const welcomeText = import.meta.env.VITE_WELCOME_TEXT ?? "欢迎访问本站";

// 鼠标右键
const mainContextmenu = (event) => {
  event.preventDefault();
  status.setSiteStatus("box");
};

// 壁纸加载完成事件（仅触发问候语，不再控制 loading）
const loadComplete = () => {
  nextTick().then(() => {
    $message.info(getGreeting() + "，" + welcomeText, {
      showIcon: false,
      duration: 3000,
    });
  });
};

// 全局键盘事件
const mainPressKeyboard = (event) => {
  const keyCode = event.keyCode;
  // 回车
  if (keyCode === 13) {
    // focus 元素
    const mainInput = document.getElementById("main-input");
    status.setSiteStatus("focus");
    mainInput?.focus();
  }
};

// 根据主题类别更改
const changeThemeType = (val) => {
  const htmlElement = document.querySelector("html");
  const themeType = val === "light" ? "light" : "dark";
  htmlElement.setAttribute("theme", themeType);
};

// 监听颜色变化
watch(
  () => set.themeType,
  (val) => changeThemeType(val),
);

onMounted(() => {
  changeThemeType(set.themeType);
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  &.main-normal,
  &.main-focus {
    .main-box {
      opacity: 0;
      margin-top: 0;
      transform: scale(0.35);
      pointer-events: none;
    }
  }
  &.main-box,
  &.main-set {
    .main-box {
      opacity: 1;
      margin-top: 20vh;
      transform: scale(1);
      visibility: visible;
      @media (max-width: 478px) {
        margin-top: 22vh;
      }
    }
    .search-input {
      :deep(.all) {
        opacity: 0;
        width: 0;
        visibility: hidden;
      }
    }
  }
  .all-controls {
    position: fixed;
    width: 100%;
    top: 0;
    padding: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    .change-status {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      padding: 8px;
      border-radius: 8px;
      color: var(--main-text-color);
      z-index: 1;
      transition:
        opacity 0.3s,
        background-color 0.3s,
        transform 0.3s;
      &:hover {
        backdrop-filter: blur(20px);
        background-color: var(--main-background-light-color);
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
}
.gate {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  .gate-box {
    width: 300px;
    padding: 24px;
    border-radius: 12px;
    background: var(--main-background-light-color, #fff);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 14px;
    .gate-title {
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      color: var(--main-text-color, #333);
    }
    .gate-err {
      font-size: 12px;
      color: #d03050;
      text-align: center;
    }
    .gate-tip {
      font-size: 12px;
      opacity: 0.5;
      text-align: center;
    }
  }
}
</style>
