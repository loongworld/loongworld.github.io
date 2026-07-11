// GitHub 数据同步层
// 数据源 = 仓库根 data.json，结构：
// { shortcuts:[{id,name,url,category}], categories:[...], notes:[{id,content,time,color}], recommend:[...] }
// Token 由用户首次在「便签」页填写，存 localStorage（key: snav_admin_token），仅用于写数据。

const OWNER = "loongworld";
const REPO = "loongworld.github.io";
const BRANCH = "main";
const FILE = "data.json";
const TOKEN_KEY = "snav_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// 拉取数据：有 token 走 API（含 sha，可写回）；无 token 回退到打包副本 /data.json
export const fetchData = async (token) => {
  if (token) {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `token ${token}` } },
    );
    if (res.status === 404) return { data: null, sha: null };
    if (!res.ok) throw new Error(`拉取失败 HTTP ${res.status}`);
    const json = await res.json();
    const content = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ""))));
    return { data: JSON.parse(content), sha: json.sha };
  }
  // 无 token：只读打包副本（首屏可用，写入仍需 token）
  const res = await fetch(`/data.json?t=${Date.now()}`);
  if (!res.ok) return { data: null, sha: null };
  return { data: await res.json(), sha: null };
};

// 获取文件 sha（写入必需）
const getSha = async (token) => {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
    { headers: { Accept: "application/vnd.github+json", Authorization: `token ${token}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取 sha 失败 HTTP ${res.status}`);
  const json = await res.json();
  return json.sha;
};

// 写入 data.json（自动取 sha，支持新建）
export const saveData = async (data, token) => {
  if (!token) throw new Error("未配置 Token");
  const sha = await getSha(token);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const body = {
    message: "chore: update site data via SNav",
    content,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `写入失败 HTTP ${res.status}`);
  }
  return res.json();
};

// 验证 token 是否对该仓库可写，并返回用户名
export const verifyToken = async (token) => {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}`,
      { headers: { Authorization: `token ${token}` } },
    );
    if (!res.ok) return { valid: false, msg: `Token 无效 (${res.status})` };
    const repo = await res.json();
    if (!repo.permissions || !repo.permissions.push)
      return { valid: false, msg: "该 Token 无仓库写权限" };
    const u = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${token}` },
    });
    const user = u.ok ? (await u.json()).login : "";
    return { valid: true, user };
  } catch (e) {
    return { valid: false, msg: e.message };
  }
};
