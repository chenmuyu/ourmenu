# 双人菜单小程序 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 UniApp Vue 3 + JavaScript 构建一个固定两人共享、按掌勺人列出菜名并可查看图片与备注的微信小程序 MVP。

**Architecture:** 页面层负责首页、详情、编辑和双人设置；领域层用纯 JavaScript 管理菜单过滤、校验和双人约束；仓储层先提供本地持久化实现，并预留微信云数据库/云存储适配器。这样可以在没有云环境 ID 时完成页面与交互，后续只替换仓储实现。

**Tech Stack:** UniApp、Vue 3、JavaScript、Vite、Vitest、微信小程序本地存储与 `wx.cloud` 适配接口。

---

### Task 1: 初始化 UniApp JavaScript 工程与测试环境

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/App.vue`
- Create: `src/manifest.json`
- Create: `src/pages.json`
- Create: `src/uni.scss`
- Create: `vitest.config.js`

**Steps:**
1. 使用 DCloud 官方 Vue 3 + Vite JavaScript 模板初始化依赖配置。
2. 增加 `test`、`test:watch` 与 `dev:mp-weixin` 脚本。
3. 运行空测试集，确认 Vitest 环境可启动。
4. 提交工程骨架。

### Task 2: 用 TDD 实现菜单领域规则

**Files:**
- Create: `src/domain/menu.js`
- Create: `tests/domain/menu.test.js`

**Steps:**
1. 编写失败测试：按掌勺人筛选并按日期、创建时间倒序排列。
2. 运行测试并确认因实现缺失而失败。
3. 实现 `getMenusByCook`，运行测试至通过。
4. 编写失败测试：菜名、掌勺人、封面必填，掌勺人必须属于固定两人。
5. 实现 `validateMenu` 并验证通过。
6. 编写失败测试：厨房只能包含两名成员。
7. 实现 `normalizeKitchen` 并验证通过。

### Task 3: 实现可替换的数据仓储

**Files:**
- Create: `src/repositories/localRepository.js`
- Create: `src/repositories/cloudRepository.js`
- Create: `src/repositories/index.js`
- Create: `tests/repositories/localRepository.test.js`

**Steps:**
1. 编写失败测试：读取默认两位成员和示例菜单。
2. 编写失败测试：新增、更新、删除菜单后可重新读取。
3. 实现本地仓储并运行测试至通过。
4. 定义与本地仓储同形的微信云开发适配器，未配置云环境时安全回退。
5. 验证全部领域与仓储测试。

### Task 4: 实现草图对应的首页

**Files:**
- Create: `src/pages/home/index.vue`
- Create: `src/components/CookTabs.vue`
- Create: `src/components/MenuBook.vue`
- Create: `src/styles/theme.scss`

**Steps:**
1. 创建固定双标签组件，显示自定义头像和名字。
2. 创建纸质菜单册面板，仅纵向列出菜名。
3. 切换标签时按掌勺人过滤菜单。
4. 点击菜名进入详情，点击悬浮按钮进入新增页。
5. 增加空状态、安全区和小屏适配。

### Task 5: 实现菜单详情与图片浏览

**Files:**
- Create: `src/pages/menu-detail/index.vue`

**Steps:**
1. 根据菜单 ID 加载详情。
2. 展示封面、详情图片、掌勺人、日期和备注。
3. 使用 `uni.previewImage` 全屏浏览图片。
4. 增加编辑入口、记录不存在和加载失败状态。

### Task 6: 实现新增和编辑菜单

**Files:**
- Create: `src/pages/menu-edit/index.vue`
- Create: `src/services/imageService.js`
- Create: `tests/services/imageService.test.js`

**Steps:**
1. 先测试图片列表合并、封面选择和上传失败保留本地路径的行为。
2. 实现图片服务并验证测试通过。
3. 实现菜名、掌勺人、日期、封面、详情图和备注表单。
4. 接入 `uni.chooseImage`、预览、移除与保存防重复提交。
5. 编辑页支持载入旧数据和二次确认删除。

### Task 7: 实现双人资料设置

**Files:**
- Create: `src/pages/settings/index.vue`

**Steps:**
1. 展示固定两位成员，不提供第三位入口。
2. 支持修改名字并自行上传头像。
3. 保存后返回首页并刷新顶部标签。

### Task 8: 微信云开发说明与最终验证

**Files:**
- Create: `docs/cloud-development.md`
- Create: `README.md`

**Steps:**
1. 记录云环境 ID、数据库集合、索引、存储权限和安全规则配置方式。
2. 运行 `npm test -- --run`，确认全部单元测试通过。
3. 运行 `git diff --check`，确认无空白错误。
4. 按本地验证约定不执行生产构建；记录微信开发者工具真机验收步骤。
