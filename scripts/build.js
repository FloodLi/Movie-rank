/**
 * scripts/build.js — 在 GitHub Actions 中抓取 10 个榜单源，生成可发布到 GitHub Pages 的静态站点
 *
 * 环境变量：
 *   TMDB_API_KEY  必填
 *   TRAKT_TOKEN   选填（缺省则跳过 trakt）
 *   PAGES_URL     站点公开地址，如 https://user.github.io/VPS-Widget
 *   SOURCES       选填，逗号分隔，只抓指定源（如 "douban,tmdb"），缺省抓全部
 *   UPSTREAM_DIR  上游代码目录（含 lib/），缺省为本脚本上一级目录
 *
 * 产物：site/data/<源>.json、site/widget.js、site/index.html
 * 某源失败时，回退使用已发布站点上的上一版数据，不中断整个流程。
 */
const fs = require("fs");
const path = require("path");

const UPSTREAM = path.resolve(process.env.UPSTREAM_DIR || path.join(__dirname, ".."));
const SITE = path.join(__dirname, "..", "site");
const DATA = path.join(SITE, "data");

const widget = require(path.join(UPSTREAM, "lib", "widget"));
const sources = {
  guduo: require(path.join(UPSTREAM, "lib", "guduo")),
  douban: require(path.join(UPSTREAM, "lib", "douban")),
  mgtv: require(path.join(UPSTREAM, "lib", "mgtv")),
  theater: require(path.join(UPSTREAM, "lib", "theater")),
  bangumi: require(path.join(UPSTREAM, "lib", "bangumi")),
  tmdb: require(path.join(UPSTREAM, "lib", "tmdb_rank")),
  bili: require(path.join(UPSTREAM, "lib", "bili")),
  mal: require(path.join(UPSTREAM, "lib", "mal")),
  anilist: require(path.join(UPSTREAM, "lib", "anilist")),
  trakt: require(path.join(UPSTREAM, "lib", "trakt")),
};

const TMDB_KEY = process.env.TMDB_API_KEY || "";
const TRAKT_TOKEN = process.env.TRAKT_TOKEN || "";
const PAGES_URL = (process.env.PAGES_URL || "").replace(/\/+$/, "");
const ONLY = (process.env.SOURCES || "").split(",").map((s) => s.trim()).filter(Boolean);

if (!TMDB_KEY) {
  console.error("缺少 TMDB_API_KEY（请在仓库 Settings → Secrets 中配置）");
  process.exit(1);
}

/** 取已发布站点上的上一版数据，失败返回 null */
async function fetchPrevious(name) {
  if (!PAGES_URL) return null;
  try {
    const res = await fetch(`${PAGES_URL}/data/${name}.json`);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(DATA, { recursive: true });
  const summary = {};

  for (const name of Object.keys(sources)) {
    const file = path.join(DATA, `${name}.json`);
    const skipped = ONLY.length && !ONLY.includes(name);
    if (skipped || (name === "trakt" && !TRAKT_TOKEN)) {
      const prev = await fetchPrevious(name);
      if (prev) fs.writeFileSync(file, prev);
      summary[name] = skipped ? "skipped(沿用旧数据)" : "skipped(无 Trakt Token)";
      continue;
    }
    try {
      const data = await sources[name].fetch(TMDB_KEY, TRAKT_TOKEN);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      summary[name] = "ok";
      console.log(`[${name}] ok`);
    } catch (e) {
      console.error(`[${name}] 失败: ${e.message || e}`);
      const prev = await fetchPrevious(name);
      if (prev) {
        fs.writeFileSync(file, prev);
        summary[name] = "failed(已回退旧数据)";
      } else {
        summary[name] = "failed(无旧数据)";
      }
    }
  }

  fs.writeFileSync(path.join(SITE, "widget.js"), widget.generate(PAGES_URL || "http://127.0.0.1:5555"));
  fs.copyFileSync(path.join(__dirname, "index.html"), path.join(SITE, "index.html"));

  console.log("\n=== 汇总 ===");
  for (const [k, v] of Object.entries(summary)) console.log(k.padEnd(8), v);

  // 全部都没拿到数据才视为失败，否则发布
  const have = Object.keys(sources).filter((n) => fs.existsSync(path.join(DATA, `${n}.json`)));
  if (!have.length) {
    console.error("没有任何可发布的数据");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
