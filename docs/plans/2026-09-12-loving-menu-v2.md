# 「粤湘情」双人菜单 V2 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 UniApp 微信小程序升级为具有双家庭成员绑定、客人只读访问、「粤湘情」菜谱、「老公我要吃这个！」心愿模块以及统一装扮设置的完整 V2。

**Architecture:** 首屏通过云函数返回的访问状态决定进入绑定页或主页面；一个轻量访问状态模块向所有页面提供 `family/guest/unbound` 角色。云函数用固定厨房文档、事务绑定和统一写权限守卫保护数据，仓储层为菜谱、心愿和设置提供同形的本地/云端接口。

**Tech Stack:** UniApp、Vue 3、JavaScript、微信云开发、`wx-server-sdk`、Vite、Vitest。

---

### Task 1: 固化身份领域规则

**Files:**
- Modify: `cloudfunctions/two-person-menu-api/binding.js`
- Modify: `tests/cloudfunctions/binding.test.js`

**Steps:**
1. 先写失败测试，覆盖空名额返回 `unbound`、已绑定 `OPENID` 返回 `family`、满两人后的陌生 `OPENID` 返回 `guest`、错误绑定码被拒绝和第三人不能占位。
2. 运行 `npm test -- --run tests/cloudfunctions/binding.test.js`，确认失败原因是新规则尚未实现。
3. 实现纯函数 `resolveAccess`、`bindFamilyMember` 和公开成员数据清洗，绑定成功只填充第一个空位。
4. 再次运行定向测试并确认通过。

### Task 2: 扩展菜谱、分组、标签和心愿领域模型

**Files:**
- Modify: `src/domain/menu.js`
- Create: `src/domain/wish.js`
- Create: `src/domain/kitchen.js`
- Modify: `tests/domain/menu.test.js`
- Create: `tests/domain/wish.test.js`
- Create: `tests/domain/kitchen.test.js`

**Steps:**
1. 写失败测试：菜谱图片不再必填，缩略图按封面、第一张详情图、空值顺序解析。
2. 写失败测试：按掌勺人和公共分组同时筛选菜谱。
3. 写失败测试：厨房补齐默认分组与四个默认标签，停用项目仍可解析历史名称。
4. 写失败测试：心愿只接受 `want/again` 状态，名称必填，图片选填，并按更新时间倒序。
5. 逐个运行测试确认红灯，再实现最小领域函数并转绿。

### Task 3: 改造本地仓储接口

**Files:**
- Modify: `src/repositories/localRepository.js`
- Modify: `tests/repositories/localRepository.test.js`

**Steps:**
1. 写失败测试覆盖 `getAccessState/bindFamily`、厨房装扮与分类设置、心愿增删改查。
2. 确认测试因接口缺失失败。
3. 扩展本地存储结构，旧数据读取时通过领域规范化函数补齐新字段；本地模式默认模拟家庭成员。
4. 运行仓储测试，确认所有新旧用例通过。

### Task 4: 实现云函数身份、权限和数据接口

**Files:**
- Modify: `cloudfunctions/two-person-menu-api/index.js`
- Modify: `src/repositories/cloudRepository.js`
- Create: `tests/repositories/cloudRepository.test.js`

**Steps:**
1. 写失败测试验证云仓储发送 `getAccessState`、`bindFamily`、心愿和设置动作。
2. 实现云仓储方法并使测试通过。
3. 云函数用 `OPENID` 解析角色；`bindFamily` 在数据库事务中再次读取厨房、校验 `0928` 并填充空位。
4. 为 `saveKitchen/saveMenu/deleteMenu/saveWish/deleteWish` 添加统一家庭成员守卫；读取动作允许家庭成员和满员后的客人。
5. 新增 `wishes` 集合 CRUD，菜单保存支持 `groupId/tagIds` 和空图片。
6. 使用 `node --check` 检查云函数语法。

### Task 5: 建立首屏身份分流

**Files:**
- Create: `src/access/session.js`
- Create: `src/pages/entry/index.vue`
- Modify: `src/pages.json`
- Modify: `src/App.vue`

**Steps:**
1. 为访问状态模块写失败测试，覆盖家庭、客人和未绑定状态缓存。
2. 实现首屏请求：家庭或客人 `reLaunch` 到「粤湘情」，未绑定停留在绑定页。
3. 绑定页实现四格数字输入、云端错误提示、成功后的入场过渡。
4. 使用奶油珊瑚背景、上浮泡泡和“欢迎回到我们的小厨房”文案。
5. 名额已满的陌生账号不得渲染绑定输入框。

### Task 6: 重构「粤湘情」首页与公共筛选

**Files:**
- Modify: `src/pages/home/index.vue`
- Modify: `src/components/CookTabs.vue`
- Modify: `src/components/MenuBook.vue`
- Create: `src/components/BottomNav.vue`
- Create: `src/components/SteamPlate.vue`

**Steps:**
1. 将首页标题替换为夸张手写招贴「粤湘情」，接入共用底图和可读性蒙层。
2. 在掌勺人标签上方增加横向食材分组筛选，筛选状态归首页持有，切换掌勺人不重置。
3. 菜单列表无图时显示 `SteamPlate`，有图显示圆形缩略图。
4. 根据角色隐藏家庭设置和新增按钮；客人显示轻量“客人浏览”标识。
5. 接入自定义底部导航，当前项为「粤湘情」。

### Task 7: 菜谱表单与详情支持分类、标签和可选图片

**Files:**
- Modify: `src/pages/menu-edit/index.vue`
- Modify: `src/pages/menu-detail/index.vue`

**Steps:**
1. 移除封面必填标识与校验。
2. 增加已有主食材分组单选和已有标签多选，不提供表单内自定义入口。
3. 详情页展示分组与标签；无图片时保持高质量文字布局。
4. 客人访问详情时隐藏编辑入口，并对异常跳转到编辑页做角色拦截。

### Task 8: 实现「老公我要吃这个！」模块

**Files:**
- Create: `src/pages/wish-home/index.vue`
- Create: `src/pages/wish-detail/index.vue`
- Create: `src/pages/wish-edit/index.vue`
- Modify: `src/pages.json`

**Steps:**
1. 页面顶部完整渲染大字“老公我要吃这个！”，其中“我要吃”最大、“这个！”倾斜叠放。
2. 增加“想吃 / 吃过还想吃”状态筛选和圆形缩略图列表。
3. 实现名称、状态、图片、店名或来源、日期、备注表单。
4. 实现详情预览、编辑和删除；客人隐藏所有写入口。
5. 接入同一张首页底图、蜜桃色蒙层与底部导航。

### Task 9: 扩展「小家设置」

**Files:**
- Modify: `src/pages/settings/index.vue`

**Steps:**
1. 保留两位成员资料编辑并只显示绑定状态，不提供解绑按钮。
2. 增加底图上传、预览、更换和恢复默认。
3. 增加食材分组与菜品标签的新增、改名、排序和停用操作。
4. 保存时一次提交规范化后的厨房设置；客人进入时立即返回首页并提示无权限。

### Task 10: 文档、产物同步与切换验收

**Files:**
- Modify: `README.md`
- Modify: `docs/cloud-development.md`
- Verify: `dist/dev/mp-weixin/`

**Steps:**
1. 更新集合、权限、绑定、部署和完全重置步骤，新增 `wishes` 集合说明。
2. 运行 `npm run test:run`、云函数 `node --check` 和 `git diff --check`。
3. 运行微信小程序开发构建并确认云函数同步到最终导入目录。
4. 在新版已准备好后，删除旧 `kitchens/menus` 记录和应用专用云存储图片；创建 `wishes` 集合。
5. 部署 `two-person-menu-api`，按“妻子绑定 → 丈夫绑定 → 第三账号客人”的顺序进行真机验收。

