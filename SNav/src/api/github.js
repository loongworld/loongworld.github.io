// GitHub 数据同步层
// 数据源 = 仓库根 data.json
// Token 内置（VITE_GITHUB_TOKEN），用户免配置；localStorage 的 snav_admin_token 可作覆盖
const OWNER = "loongworld";
const REPO = "loongworld.github.io";
const BRANCH = "main";
const FILE = "data.json";
const TOKEN_KEY = "snav_admin_token";

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || import.meta.env.VITE_GITHUB_TOKEN || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const fetchData = async (token) => {
  const tk = token || getToken();
  if (tk) {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${tk}` } },
    );
    if (res.status === 404) return { data: null, sha: null };
    if (!res.ok) throw new Error(`拉取失败 HTTP ${res.status}`);
    const json = await res.json();
    const content = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ""))));
    return { data: JSON.parse(content), sha: json.sha };
  }
  const res = await fetch(`/data.json?t=${Date.now()}`);
  if (!res.ok) return { data: null, sha: null };
  return { data: await res.json(), sha: null };
};

const getSha = async (tk) => {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
    { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${tk}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取 sha 失败 HTTP ${res.status}`);
  const json = await res.json();
  return json.sha;
};

export const saveData = async (data, token) => {
  const tk = token || getToken();
  if (!tk) throw new Error("未配置 Token");
  const sha = await getSha(tk);
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
        Authorization: `Bearer ${tk}`,
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

export const verifyToken = async (token) => {
  try {
    const tk = token || getToken();
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}`,
      { headers: { Authorization: `Bearer ${tk}` } },
    );
    if (!res.ok) return { valid: false, msg: `Token 无效 (${res.status})` };
    const repo = await res.json();
    if (!repo.permissions || !repo.permissions.push)
      return { valid: false, msg: "该 Token 无仓库写权限" };
    const u = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tk}` },
    });
    const user = u.ok ? (await u.json()).login : "";
    return { valid: true, user };
  } catch (e) {
    return { valid: false, msg: e.message };
  }
};
