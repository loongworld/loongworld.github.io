import axios from "@/utils/request";
import fetchJsonp from "fetch-jsonp";

/**
 * 获取一言
 * https://hitokoto.cn/api
 * 分类：a动画 b漫画 c游戏 d文学 e原创 f网络 g其他
 */
export const getHitokoto = async () => {
  return axios({
    method: "GET",
    url: "https://v1.hitokoto.cn/",
    params: {
      encode: "json",
      c: ["a", "b", "c", "d", "e", "f", "g"],
    },
  });
};

/**
 * 获取搜索建议
 * https://suggestion.baidu.com
 * @param {String} keyWord - 搜索关键字
 */
export const getSearchSuggestions = async (keyWord) => {
  try {
    const encodedKeyword = encodeURIComponent(keyWord);
    const response = await fetchJsonp(
      `https://suggestion.baidu.com/su?wd=${encodedKeyword}&cb=json`,
      {
        // 回调参数
        jsonpCallback: "cb",
      },
    );
    const data = await response.json();
    return data.s;
  } catch (error) {
    console.error("处理搜索建议发生错误：", error);
    return null;
  }
};
