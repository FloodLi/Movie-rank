# 全站榜单-Rex/Fw/Capy模块

一个**常驻 VPS 服务**：每天定时抓取 **10 个榜单源**
（骨朵 / 豆瓣 / 芒果TV / 剧场平台 / 番剧 / TMDB / B站 / MAL / AniList / Trakt），带**网页管理面板**（填 TMDB API Key、Trakt Token、预览各源数据），
并**自动生成聚合 fw/rex/capy 模块 widget.js**。

## 抓取的 10 个源
| 源 | 内容 | 数据接口 |
|---|---|---|
| 骨朵热度 `guduo` | 剧集 / 综艺 / 动漫 / 电影 4 分类 | `/data/guduo.json` |
| 豆瓣热榜 `douban` | 9 个区域（大陆/欧美/日/韩/动漫/纪录/综艺…） | `/data/douban.json` |
| 芒果TV `mgtv` | 剧集 + 王牌综艺 | `/data/mgtv.json` |
| 剧场平台 `theater` | 15 个剧场（迷雾/白夜/X/恋恋…） | `/data/theater.json` |
| 番剧 `bangumi` | bgm.tv 排名榜（公开 sort=rank，无需登录） | `/data/bangumi.json` |
| TMDB `tmdb` | 剧集趋势 / 电影趋势 / 热门剧 / 热门电影 | `/data/tmdb.json` |
| B站 `bili` | PGC 番剧榜 + 国创榜（标题自动去配音后缀） | `/data/bili.json` |
| MAL `mal` | MyAnimeList 热播番剧 | `/data/mal.json` |
| AniList `anilist` | AniList 热门番剧 | `/data/anilist.json` |
| Trakt `trakt` | Trakt 榜单（周/流行/热门等，需面板填 Token） | `/data/trakt.json` |

每个源都由对应 `lib/<源>.js` 抓取 + TMDB 匹配，结果结构与原 List 仓库 JSON 保持一致。


## HTTP 接口
| 方法 / 路径 | 说明 |
|---|---|
| `GET /` | 管理面板 |
| `GET /data/<源>.json` | 各源数据（CORS 已开） |
| `GET /widget.js` | 生成的聚合模块 |
| `GET /api/sources` | 各源状态 |
| `GET/POST /api/config` | 读/写配置 |
| `POST /api/update` | 更新全部（带 `{source:xxx}` 单源） |
| `GET /api/preview?source=xxx` | 预览 |
| `GET /api/widget` | widget 地址+代码 |

## 配置
`config.json` 自动生成：`tmdbApiKey`、`traktToken`、`vpsAddress`、`updateHour`、`updateEnabled`。

## 生成模块
聚合模块 `id: makka.vps.aggregator`，10 个子模块：`loadGuduo` / `loadDouban` / `loadMangoTV` /
`loadTheater` / `loadBangumi` / `loadTmdb` / `loadBili` / `loadMAL` / `loadAniList` / `loadTrakt`。
条目为 `VideoItem`（`type:"tmdb"` + 数字 `tmdbId` + `mediaType`），
点击走 播放器软件 内置 TMDB 详情页。数据源默认你填的 VPS 地址，也可在模块 `globalParams.baseUrl` 改。
