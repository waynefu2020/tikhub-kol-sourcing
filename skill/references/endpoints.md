# TikHub 接口速查

本项目通过 TikHub API（`https://api.tikhub.io`）获取 TikTok 红人数据。以下是常用接口。

## 认证方式

所有接口使用 Bearer Token 认证：
```
Authorization: Bearer {TIKHUB_API_KEY}
```

API Key 存放在项目根目录 `.env` 文件中：
```
TIKHUB_API_KEY=你的密钥
```

---

## 常用接口

### 1. 关键词搜用户（最常用）

**路径**: `/api/v1/tiktok/web/fetch_search_user`
**方法**: GET
**适用**: 直接按关键词搜索 TikTok 用户，最常用的红人发现方式

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 搜索关键词 |
| cursor | number | 分页游标，首次传 0 |

**响应列表路径**: `data.user_list`（备选 `data.users`）
**分页**: `data.cursor`（下一页游标），`data.has_more`（是否还有更多）
**类型**: user — 每条记录直接是一个用户

**Creator 字段映射**:
```
unique_id  → user_info.unique_id 或 unique_id
nickname   → user_info.nickname 或 nickname
avatar     → user_info.avatar_medium.url_list[0] 或 avatarMedium
bio        → user_info.signature 或 signature 或 bio
follower   → user_info.follower_count 或 followerCount
videos     → user_info.aweme_count 或 videoCount
```

---

### 2. 通用搜索

**路径**: `/api/v1/tiktok/app/v3/fetch_general_search_result`
**方法**: GET
**适用**: 内容+用户混合搜索，结果可能包含视频和用户

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 搜索关键词 |
| offset | number | 偏移量，首次传 0 |
| count | number | 每页数量，建议 20 |

**响应列表路径**: `data.data`
**分页**: 下次请求 offset += count，`data.has_more`
**类型**: mixed — 需检查每条记录类型

**注意**: 结果可能是视频或用户混合，需从视频中提取 author 对象。

---

### 3. 话题视频列表

**路径**: `/api/v1/tiktok/web/fetch_hashtag_video_list`
**方法**: GET
**适用**: 搜特定话题标签下的热门视频，从中提取活跃博主

| 参数 | 类型 | 说明 |
|------|------|------|
| hashtag_id | string | 话题 ID（需先查询话题获取 ID） |
| cursor | number | 分页游标，首次传 0 |

**响应列表路径**: `data.aweme_list`
**分页**: `data.cursor`，`data.has_more`
**类型**: post — 每条是一个视频，需从 `.author` 提取博主

**Creator 字段映射（从帖子提取）**:
```
unique_id  → aweme.author.unique_id
nickname   → aweme.author.nickname
avatar     → aweme.author.avatar_medium.url_list[0]
bio        → aweme.author.signature
follower   → aweme.author.follower_count
videos     → aweme.author.aweme_count
```

**特殊处理**: 同一博主可能出现在多条视频中，需按 unique_id 聚合去重并计 matched_videos。

---

### 4. 用户搜索（App 版）

**路径**: `/api/v1/tiktok/app/v3/fetch_user_search_result`
**方法**: GET
**适用**: Web 版接口不稳定时的备选

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 搜索关键词 |
| offset | number | 偏移量，首次传 0 |
| count | number | 每页数量，建议 20 |

**响应列表路径**: `data.user_list`
**分页**: offset += count，`data.has_more`
**类型**: user

---

### 5. 获取用户 Profile（Web 版）⭐ 推荐

**路径**: `/api/v1/tiktok/web/fetch_user_profile`
**方法**: GET
**适用**: Phase 2 Profile 补全，获取完整 bio 和邮箱

| 参数 | 类型 | 说明 |
|------|------|------|
| uniqueId | string | **优先使用**，用户主页链接中的用户名（如 `renz.sadiwa`） |
| sec_user_id | string | 备选，用户的 secUid |

**响应路径**: `data.userInfo.user`
**类型**: user

**Creator 字段映射**:
```
unique_id   → data.userInfo.user.uniqueId
nickname    → data.userInfo.user.nickname
avatar      → data.userInfo.user.avatarMedium
bio         → data.userInfo.user.signature
follower    → data.userInfo.user.followerCount
videos      → data.userInfo.user.videoCount
verified    → data.userInfo.user.verified       // 是否认证
bioLink     → data.userInfo.user.bioLink.link   // 落地页链接
```

**缓存优势**：
- 请求成功后会返回 `cache_url`，24 小时内重复访问不扣费
- 适合脚本中断后重跑场景

---

## 推荐工作流：两步法

**Step 1 — 视频搜索发现创作者**（见通用搜索接口 #2）
**Step 2 — User Profile 补全 bio 和邮箱**

```
/api/v1/tiktok/web/fetch_user_profile?uniqueId={unique_id}
```

| 字段 | 路径 |
|------|------|
| 完整 bio | `data.userInfo.user.signature` |
| 粉丝数 | `data.userInfo.user.followerCount` |
| 视频数 | `data.userInfo.user.videoCount` |
| 昵称 | `data.userInfo.user.nickname` |
| 头像 | `data.userInfo.user.avatarMedium` |
| 落地页 | `data.userInfo.user.bioLink.link` |

**效果对比（实测）**：
- 仅视频搜索：有邮箱率 ~5%
- 视频搜索 + Profile 补全：有邮箱率 46%+（Anker 充电宝实测 54 人中 25 人有邮箱）

原因：视频搜索返回的 author 对象是精简版，`signature` 字段常为空；调用 `fetch_user_profile` 才能获取完整 bio，其中包含创作者留下的联系邮箱。

限速：10 req/s，建议请求间隔 150ms。

---

## Profile API 对比

用于 Phase 2 补全的两种用户信息接口对比：

| 维度 | `/app/v3/handler_user_profile` | `/web/fetch_user_profile` ⭐ |
|------|-------------------------------|----------------------------|
| 参数 | `unique_id` | `uniqueId`（优先） |
| Bio 路径 | `data.user.signature` | `data.userInfo.user.signature` |
| 邮箱获取 | ✅ | ✅ |
| 头像 URL | ❌ | ✅ `avatarMedium` |
| 落地页链接 | ❌ | ✅ `bioLink.link` |
| 认证状态 | ❌ | ✅ `verified` |
| 缓存 | ❌ | ✅ **24h 缓存** |
| 费用 | $0.0010/次 | $0.0010/次（缓存免费） |

**推荐**：Phase 2 使用 `/web/fetch_user_profile`，字段更丰富且有缓存，中断重跑可省费用。

---

## 接口选择建议

**推荐优先级（从高到低）**：

| 场景 | 推荐接口 | 原因 |
|------|---------|------|
| **默认（大多数情况）** | 通用搜索 #2 加 `search_type=1` | **视频搜索**：找真实内容创作者，过滤商家号 |
| **Phase 2 Profile 补全** | `/web/fetch_user_profile` (#5) | 字段完整 + 24h 缓存 |
| 搜特定话题 | 话题视频 (#3) | 需要先获取 hashtag_id |
| 视频搜索无结果时备选 | 关键词搜用户 (#1) | 直接搜账号名，商家号多但字段更完整 |
| #1 返回结果少 | App 版用户搜索 (#4) | 数据源不同，可能有更多结果 |

### 为什么视频搜索优于用户搜索？

用户搜索（`fetch_search_user`）按账号名匹配，结果中充斥商家号、机构号——它们恰好把产品词放在账号名里，但并非内容创作者。

视频搜索（`fetch_general_search_result?search_type=1`）按内容匹配，找到的是「在做这类内容」的真实博主，质量更高，与 TikTok 网页搜索结果一致。

**视频搜索的 creator 字段路径**：
```
response.data.data[].aweme_info.author.unique_id
response.data.data[].aweme_info.author.nickname
response.data.data[].aweme_info.author.follower_count
response.data.data[].aweme_info.author.signature   // bio（可能为空）
response.data.data[].aweme_info.statistics.play_count
response.data.data[].aweme_info.statistics.digg_count
response.data.data[].aweme_info.desc               // 视频标题
```

**注意**：视频搜索的 author 对象中 bio（signature）字段有时为空，建议用视频标题（desc）辅助判断博主内容方向。

---

## 响应结构自动检测 Cascade

当用户提供了一个未知接口时，按以下顺序检测响应结构：

```
1. response.data.user_list 存在且是数组 → user 类型
2. response.data.users 存在且是数组 → user 类型
3. response.data.aweme_list 存在且是数组 → post 类型（提取 author）
4. response.data.data 存在且是数组 → 检查首条：
   a. 有 unique_id / uniqueId → user 类型
   b. 有 aweme_id / video_id → post 类型
5. 都不匹配 → 打印 response.data 的顶层 key，问用户确认
```
