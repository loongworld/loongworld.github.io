<template>
  <Provider>
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
import { onMounted, nextTick, watch, ref } from "vue";
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
</style>
