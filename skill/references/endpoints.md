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

## 接口选择建议

| 场景 | 推荐接口 | 原因 |
|------|---------|------|
| 大多数情况 | 关键词搜用户 (#1) | 稳定、直接返回用户、字段最全 |
| 搜特定话题 | 话题视频 (#3) | 需要先获取 hashtag_id |
| #1 返回结果少 | App 版用户搜索 (#4) | 数据源不同，可能有更多结果 |
| 想同时看内容 | 通用搜索 (#2) | 可以看到匹配的视频内容 |

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
