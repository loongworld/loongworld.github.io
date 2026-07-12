<template>
  <footer id="footer" @click.stop>
    <div class="copyright">
      <span class="site-name">{{ siteName }}</span>
      <span class="year">{{ fullYear }}</span>
      <span class="anthor" @click="jumpTo(copyrightLink ?? 'https://github.com/imsyy/Snavigation')">
        {{ siteAnthor }}
      </span>
      <span v-if="icp" class="icp" @click="jumpTo('https://beian.miit.gov.cn')">
        {{ icp }}
      </span>
      <span class="about" @click="aboutSiteModal = true">关于</span>
      <!-- 构建日期：push+build 后自动更新，一眼看出是不是新版 -->
      <span class="build-date" :title="'构建于 ' + buildDate">{{ buildDate }}</span>
    </div>
    <!-- 关于 -->
    <n-modal
      preset="card"
      :bordered="false"
      v-model:show="aboutSiteModal"
      transform-origin="center"
    >
      <div class="about-modal">
        <div class="about">
          <span class="name">{{ siteName }}</span>
          <span class="version">v {{ packageJson.version }}</span>
        </div>
        <div class="desc">
          <n-space class="link" justify="center">
            <n-button strong secondary @click="jumpTo('https://github.com/imsyy/Snavigation')">
              Github
            </n-button>
          </n-space>
        </div>
      </div>
    </n-modal>
  </footer>
</template>

<script setup>
import { ref } from "vue";
import { setStore } from "@/stores";
import { NModal, NButton, NSpace } from "naive-ui";
import packageJson from "@/../package.json";

const set = setStore();

// 站点数据
const icp = import.meta.env.VITE_ICP;
const siteName = import.meta.env.VITE_SITE_TITLE;
const siteAnthor = import.meta.env.VITE_SITE_ANTHOR;
const copyrightLink = import.meta.env.VITE_SITE_COPYRIGHTLINK;
const fullYear = new Date().getFullYear();

// 构建日期：每次 Actions build 时由 vite 注入
const buildDate = import.meta.env.VITE_BUILD_DATE ?? "未知";

// 关于弹窗数据
const aboutSiteModal = ref(false);

// 跳转
const jumpTo = (url) => {
  if (set.urlJumpType === "href") {
    window.location.href = url;
  } else if (set.urlJumpType === "open") {
    window.open(url, "_blank");
  }
};
</script>

<style lang="scss" scoped>
#footer {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  bottom: 0;
  height: 50px;
  width: 100%;
  color: var(--main-text-color);
  z-index: 1;
  .copyright {
    display: flex;
    align-items: center;
    font-size: 13px;
    span {
      margin: 0 2px;
      opacity: 0.6;
      transition: opacity 0.3s;
      &::before {
        opacity: 0.6;
        transition: none;
      }
    }
    .year {
      &::before {
        content: "@";
        opacity: 1;
        margin-right: 4px;
      }
    }
    .icp {
      &::before {
        content: "|";
        margin-right: 4px;
      }
    }
    .about {
      &::before {
        content: "|";
        margin-right: 4px;
      }
    }
    .build-date {
      margin-left: 8px;
      font-size: 11px;
      opacity: 0.5;
      font-family: monospace;
      white-space: nowrap;
      cursor: help;
      &:hover { opacity: 0.9; }
    }
    .anthor,
    .icp,
    .about {
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }
}
.about-modal {
  margin-bottom: 10px;
  .about {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    .name {
      font-size: 26px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .version {
      opacity: 0.6;
      font-size: 16px;
    }
  }
  .desc {
    margin-top: 20px;
  }
}
</style>
