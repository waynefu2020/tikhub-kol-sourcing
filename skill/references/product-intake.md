# 产品诊断与搜索策略

## 产品信息收集

用自然对话方式一次性收集，不要逐条追问。示例话术：

> 在帮你找红人之前，我先了解一下你的产品。请告诉我：
> 1. 你的产品叫什么？是什么品类？
> 2. 主要卖到哪些国家/地区？
> 3. 目标用户是谁？（年龄、身份、兴趣）
> 4. 产品最大的 2-3 个卖点是什么？
> 5. 零售价大概多少？
> 6. 有没有主要的竞品品牌？

### 字段清单

| 字段 | 必要性 | 推断规则 |
|------|--------|---------|
| 产品名称 | 必填 | — |
| 产品品类 | 必填 | 可从产品名推断 |
| 目标市场 | 必填 | 默认美国 |
| 目标人群 | 重要 | 可从品类+价格推断 |
| 核心卖点 | 重要 | 可从产品描述提取 |
| 价格区间 | 可选 | 影响红人层级选择 |
| 竞品品牌 | 可选 | 有则加竞品词维度 |

如果用户只给了部分信息，基于已知信息推断缺失项，但要明确标注：
> "我推测你的目标人群是 18-30 岁的女性消费者，对吗？"

---

## 搜索策略：四维关键词模型

### 维度一：品类词

直接搜产品品类相关内容，找已经在做该品类内容的博主。

- 核心品类名 + review / haul / unboxing / tutorial
- 细分品类名 + 内容类型

### 维度二：场景词

搜目标人群的使用场景，找与人群重合度高的博主。

- 使用场景 + vlog / routine / day in my life
- 生活方式关键词

### 维度三：竞品词

搜已经在推竞品的博主，这些博主品类兴趣已验证、转化可能性最高。

- 竞品品牌名 + review / vs / comparison / alternative
- 仅在用户提供了竞品信息时使用

### 维度四：人群词

搜目标人群聚集的泛内容，扩大漏斗。

- 人群身份标签 + essentials / favorites / must have
- 人群活动场景

---

## 品类搜索策略模板

### 美妆护肤

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `skincare routine`, `foundation review`, `{product} tutorial` |
| 场景词 | `get ready with me`, `morning routine`, `night skincare` |
| 竞品词 | `{competitor} review`, `{competitor} vs`, `{competitor} dupe` |
| 人群词 | `beauty favorites`, `holy grail products`, `drugstore makeup` |

### 3C 电子

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `{category} unboxing`, `{category} review`, `tech haul` |
| 场景词 | `desk setup`, `work from home setup`, `gaming setup` |
| 竞品词 | `{competitor} review`, `{competitor} vs {competitor}` |
| 人群词 | `tech essentials`, `best gadgets`, `student tech` |

### 食品饮料

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `{category} taste test`, `{category} review`, `trying {product}` |
| 场景词 | `what I eat in a day`, `meal prep`, `healthy recipes` |
| 竞品词 | `{competitor} review`, `{competitor} taste test` |
| 人群词 | `healthy snacks`, `fitness nutrition`, `vegan food` |

### 服饰时尚

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `{category} haul`, `{category} try on`, `outfit ideas` |
| 场景词 | `OOTD`, `what I wore this week`, `capsule wardrobe` |
| 竞品词 | `{competitor} haul`, `{competitor} review` |
| 人群词 | `fashion essentials`, `style tips`, `thrift haul` |

### 文具办公

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `notebook review`, `planner setup`, `stationery haul` |
| 场景词 | `study with me`, `desk setup`, `bullet journal` |
| 竞品词 | `{competitor} review`, `{competitor} vs` |
| 人群词 | `college essentials`, `back to school`, `productivity tips` |

### 家居生活

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `{category} review`, `home haul`, `{category} organization` |
| 场景词 | `home tour`, `room makeover`, `apartment decorating` |
| 竞品词 | `{competitor} review`, `{competitor} haul` |
| 人群词 | `home essentials`, `first apartment`, `cozy home` |

### 健身运动

| 维度 | 关键词示例 |
|------|-----------|
| 品类词 | `{category} review`, `gym equipment review`, `{product} test` |
| 场景词 | `workout routine`, `gym vlog`, `fitness journey` |
| 竞品词 | `{competitor} review`, `{competitor} vs` |
| 人群词 | `fitness essentials`, `gym must haves`, `home workout` |

---

## 目标市场对搜索语言的影响

| 市场 | 搜索语言 | 注意事项 |
|------|---------|---------|
| 美国/英国/澳洲 | 英文 | 默认语言 |
| 日本 | 日文 | 用日文关键词，如「スキンケア」「開封」 |
| 韩国 | 韩文 | 用韩文，如「리뷰」「하울」 |
| 东南亚 | 英文 + 当地语言 | 印尼/泰国/越南分别处理 |
| 拉美 | 西班牙文 | 如 `reseña`, `rutina de skincare` |
| 中东 | 阿拉伯文/英文 | 部分博主用英文内容 |

---

## 输出格式

产品诊断完成后，输出搜索策略建议，格式：

```
📋 产品诊断摘要
- 产品：{name} ({category})
- 市场：{markets}
- 人群：{audience}
- 卖点：{usp}
- 竞品：{competitors}

🔍 推荐搜索关键词（共 {n} 组）

品类词：
  1. "{keyword}" — 搜已经在做{category}内容的博主
  2. "{keyword}" — ...

场景词：
  3. "{keyword}" — 搜{audience}常看的内容场景
  4. "{keyword}" — ...

竞品词：
  5. "{keyword}" — 搜已经在推{competitor}的博主，转化潜力最高

人群词：
  6. "{keyword}" — 扩大漏斗，触达泛{audience}群体

建议每组抓取 {n} 条，合计约 {total} 位博主（去重后预计 {estimated}）

确认这些关键词可以吗？想增减或调整哪些？
```
