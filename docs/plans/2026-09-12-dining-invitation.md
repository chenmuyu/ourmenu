# Dining Invitation Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a date-based dining invitation flow where family members create and share an invitation, multiple OpenID-identified participants submit editable dish selections, and family members manage the resulting dining record and photos.

**Architecture:** Keep the existing single cloud function and repository abstraction. Add pure dining-domain helpers for client behavior, CommonJS cloud helpers for trusted validation and identity handling, two Cloud Database collections for invitations and participant orders, and four non-tab pages for creation, ordering, records, and management. All authorization remains server-side and participant identity always comes from `cloud.getWXContext().OPENID`.

**Tech Stack:** uni-app Vue 3 with JavaScript, WeChat Mini Program native sharing, WeChat Cloud Functions/Database/Storage, Vitest.

---

### Task 1: Client dining domain

**Files:**
- Create: `src/domain/dining.js`
- Create: `tests/domain/dining.test.js`

**Step 1: Write the failing tests**

Cover these behaviors with real exported functions:

```js
import {
  buildMenuSnapshot,
  countOrderDishes,
  formatShanghaiDate,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  validateDiningInvite,
  validateDiningOrder,
} from '../../src/domain/dining.js'

expect(formatShanghaiDate(Date.UTC(2026, 8, 12, 16, 30))).toBe('2026-09-13')
expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 15, 59))).toBe('open')
expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 16, 0))).toBe('closed')
expect(normalizeCustomDishNames(['  烤串  ', '烤串', '', '小龙虾'])).toEqual(['烤串', '小龙虾'])
expect(validateDiningInvite({ theme: '', diningDate: '2026-09-20' }).message).toBe('请填写聚餐主题')
expect(validateDiningOrder({ menuItems: [], customDishNames: [] }).message).toBe('至少选择或输入一道菜')
expect(buildMenuSnapshot(menu, kitchen)).toMatchObject({ id: menu.id, name: menu.name, cookName: '我' })
expect(countOrderDishes({ menuItems: [{ id: '1' }], customDishNames: ['烤串'] })).toBe(2)
```

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/domain/dining.test.js`

Expected: FAIL because `src/domain/dining.js` does not exist.

**Step 3: Implement the minimal domain API**

Implement:

- `formatShanghaiDate(timestamp = Date.now())` using `Intl.DateTimeFormat(...).formatToParts()` with `timeZone: 'Asia/Shanghai'`.
- `getDiningInviteStatus(invite, now)` returning `open` while Shanghai's current date is less than or equal to `diningDate`, otherwise `closed`.
- `normalizeCustomDishNames(names, limit = 12, maxLength = 30)` trimming, removing blanks, deduplicating, truncating each value, and limiting count.
- `validateDiningInvite(invite)` requiring a non-empty theme and `YYYY-MM-DD` date.
- `buildMenuSnapshot(menu, kitchen)` returning stable historical fields: `id`, `name`, `cookId`, `cookName`, `groupId`, `tagIds`, and thumbnail URL.
- `validateDiningOrder(order)` requiring at least one menu item or normalized custom dish.
- `countOrderDishes(order)`.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/domain/dining.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/domain/dining.js tests/domain/dining.test.js
git commit -m "feat: add dining invitation domain"
```

### Task 2: Repository contracts and local implementation

**Files:**
- Modify: `src/repositories/cloudRepository.js`
- Modify: `src/repositories/localRepository.js`
- Modify: `tests/repositories/cloudRepository.test.js`
- Modify: `tests/repositories/localRepository.test.js`

**Step 1: Write failing repository tests**

Add cloud contract assertions for these exact calls:

```js
await repository.createDiningInvite({ theme: '周末聚餐', diningDate: '2026-09-20' })
await repository.getDiningInvite('invite-1')
await repository.listDiningInvites()
await repository.saveDiningInvite({ id: 'invite-1', theme: '改个主题' })
await repository.getMyDiningOrder('invite-1')
await repository.saveMyDiningOrder('invite-1', { participantName: '妈妈', menuIds: ['menu-1'] })
await repository.listDiningOrders('invite-1')
await repository.saveDiningOrder('invite-1', { id: 'order-1', customDishNames: ['烤串'] })
```

Add local repository tests that prove:

- an invitation can be created, listed, loaded, and updated;
- the same local participant has only one order per invitation;
- resubmitting replaces the current menu IDs and custom dish names;
- invitation summaries contain participant and dish counts.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/repositories/cloudRepository.test.js tests/repositories/localRepository.test.js`

Expected: FAIL because dining repository methods are missing.

**Step 3: Add repository methods**

Add the eight methods to `createCloudRepository`, all delegating to the single cloud function with explicit `inviteId`, `invite`, or `order` payload keys.

In `createLocalRepository`, add storage keys:

```js
const DINING_INVITES_KEY = 'two-person-menu:dining-invites'
const DINING_ORDERS_KEY = 'two-person-menu:dining-orders'
```

Implement the same methods using cloned storage values. Local mode uses a stable participant identity `local-family-cook-a`, rebuilds selected snapshots from current menus, replaces the person's order on resubmit, sorts invitations newest dining date first, and calculates list summaries from stored orders.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/repositories/cloudRepository.test.js tests/repositories/localRepository.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/repositories/cloudRepository.js src/repositories/localRepository.js tests/repositories/cloudRepository.test.js tests/repositories/localRepository.test.js
git commit -m "feat: add dining repository operations"
```

### Task 3: Cloud dining validation and persistence

**Files:**
- Create: `cloudfunctions/two-person-menu-api/dining.js`
- Create: `tests/cloudfunctions/dining.test.js`
- Modify: `cloudfunctions/two-person-menu-api/index.js`
- Modify: `tests/build/syncCloudFunctions.test.js`

**Step 1: Write failing cloud helper tests**

Use `createRequire` to test CommonJS helpers. Cover:

- Shanghai date rollover and automatic closing;
- invite input normalization and validation;
- manual dish trim/dedupe/limits;
- deterministic order document ID from invite ID and OpenID;
- family member name resolution versus optional guest name;
- trusted snapshots created from current menu documents and public kitchen data;
- public serializers never exposing `createdBy`, `participantOpenid`, or `_openid`.

Extend the cloud sync test to assert `dining.js` is copied into `dist/dev/mp-weixin/cloudfunctions/two-person-menu-api`.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/cloudfunctions/dining.test.js tests/build/syncCloudFunctions.test.js`

Expected: FAIL because the cloud dining helper does not exist.

**Step 3: Implement pure CommonJS helpers**

Export:

```js
module.exports = {
  buildMenuSnapshots,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  normalizeDiningInviteInput,
  normalizeDiningOrderInput,
  orderDocumentId,
  participantNameForAccess,
  publicDiningInvite,
  publicDiningOrder,
}
```

Use Node's built-in `crypto.createHash('sha256')` for a deterministic, non-reversible order document ID.

**Step 4: Run helper tests and verify GREEN**

Run: `npm test -- --run tests/cloudfunctions/dining.test.js tests/build/syncCloudFunctions.test.js`

Expected: PASS.

**Step 5: Write failing static action tests**

Add assertions in `tests/cloudfunctions/dining.test.js` that read `index.js` and require the eight dining action names, `assertCanWrite` on family-only actions, and the collections `diningInvites` and `diningOrders`.

Run: `npm test -- --run tests/cloudfunctions/dining.test.js`

Expected: FAIL because actions are not yet registered.

**Step 6: Implement cloud actions**

Add collections:

```js
const diningInvites = database.collection('diningInvites')
const diningOrders = database.collection('diningOrders')
```

Implement:

- `createDiningInvite`: family only; validate theme/date; initialize `imageUrls`; store `createdBy`.
- `getDiningInvite`: return a public invitation plus computed status to any signed-in visitor with the ID.
- `listDiningInvites`: family only; list recent invitations and calculate order/dish counts.
- `saveDiningInvite`: family only; update theme/date/images; clean removed cloud files only after the database update.
- `getMyDiningOrder`: load only deterministic document ID for current OpenID.
- `saveMyDiningOrder`: require open invitation; resolve family name when applicable, otherwise optional guest name; fetch trusted menus by selected IDs; replace this participant's full current selection with `.set()`.
- `listDiningOrders`: family only; never return participant OpenIDs.
- `saveDiningOrder`: family only; update the selected public fields for a specific order in the invitation.

Missing documents return `null` where the existing repository convention expects it. Invalid or ended invitations return clear Chinese messages.

**Step 7: Run cloud tests and verify GREEN**

Run: `npm test -- --run tests/cloudfunctions/dining.test.js tests/build/syncCloudFunctions.test.js`

Expected: PASS.

**Step 8: Commit**

```bash
git add cloudfunctions/two-person-menu-api/dining.js cloudfunctions/two-person-menu-api/index.js tests/cloudfunctions/dining.test.js tests/build/syncCloudFunctions.test.js
git commit -m "feat: add cloud dining invitation api"
```

### Task 4: Page registration and owner home entry points

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/home/index.vue`
- Create: `tests/pages/dining-pages.test.js`

**Step 1: Write failing page contract tests**

Assert that `pages.json` registers these non-tab pages:

```text
pages/dining-create/index
pages/dining-order/index
pages/dining-records/index
pages/dining-manage/index
```

Assert the home source contains “欢迎点菜”, “点菜记录”, and navigation to the create and record list pages, gated by `isFamily`.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: FAIL because pages and owner entry points are missing.

**Step 3: Register pages and add the invitation card**

Add all four pages to `src/pages.json` with suitable navigation titles. Add a refined cream-and-wine-red invitation card below the home header. Keep it visible only for family members and avoid a third tab bar item. Add `openDiningCreate()` and `openDiningRecords()` functions.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages.json src/pages/home/index.vue tests/pages/dining-pages.test.js
git commit -m "feat: add dining invitation home entries"
```

### Task 5: Invitation creation and record list pages

**Files:**
- Create: `src/pages/dining-create/index.vue`
- Create: `src/pages/dining-records/index.vue`
- Modify: `tests/pages/dining-pages.test.js`

**Step 1: Extend failing page tests**

Assert source contracts for:

- a date picker and theme input;
- `validateDiningInvite` before create;
- navigation to `/pages/dining-manage/index?id=...` after creation;
- owner access checks on both pages;
- invite cards showing theme, date, status, participant count, and dish count.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: FAIL because page source files are missing.

**Step 3: Implement pages**

Create a date-first “开席卡” form with today's Shanghai date as the initial value, a required theme field, validation, submit lock, and error feedback. Create a record list with first-load state, retry state, open/closed badges, empty state, and navigation to the management page.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/dining-create/index.vue src/pages/dining-records/index.vue tests/pages/dining-pages.test.js
git commit -m "feat: add dining invitation owner pages"
```

### Task 6: Shared ordering experience

**Files:**
- Create: `src/pages/dining-order/index.vue`
- Modify: `tests/pages/dining-pages.test.js`

**Step 1: Extend failing page tests**

Assert that the ordering page:

- loads invite, kitchen, menus, access state, and the current OpenID's saved order;
- restores selected menu IDs and custom dish names;
- supports common group filters without splitting into cook tabs;
- shows thumbnail, dish name, tags, and cook name;
- has optional guest-name input only for guest role;
- submits the complete current selection with `saveMyDiningOrder`;
- switches to a success summary and supports “再改改”;
- renders ended invitations read-only;
- exports `onShareAppMessage` with title “欢迎来到粤湘情小菜馆” and the same invite ID path.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: FAIL because the ordering page is missing.

**Step 3: Implement the ordering page**

Use a single scrollable menu list and a sticky action bar. Store selection in a `Set`-compatible array for Vue reactivity. Existing saved menu items restore by ID; deleted historical items remain visible in the success summary but cannot be newly selected. Manual entries use removable chips and `normalizeCustomDishNames`. At least one dish is required. Never render other participants' orders.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/dining-order/index.vue tests/pages/dining-pages.test.js
git commit -m "feat: add shared dining order page"
```

### Task 7: Owner invitation management and photos

**Files:**
- Create: `src/pages/dining-manage/index.vue`
- Modify: `tests/pages/dining-pages.test.js`

**Step 1: Extend failing page tests**

Assert that the management page:

- verifies family access;
- loads invite and all orders;
- displays participants grouped with selected and custom dishes;
- edits theme and dining date;
- uses `chooseImages`, `uploadForCurrentMode`, and a nine-image cap;
- saves through `saveDiningInvite`;
- contains an `open-type="share"` button;
- shares title “欢迎来到粤湘情小菜馆” and path `/pages/dining-order/index?id=...`.

**Step 2: Run tests and verify RED**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: FAIL because the management page is missing.

**Step 3: Implement the page**

Create a visual invitation header, status badge, editable theme/date fields, participant order cards, empty state, and a compact photo wall. Keep photos at invite level, allow preview/remove/upload, and disable duplicate saves. Preserve already saved data if a later image upload fails and show a retryable message.

For owner order edits, allow editing the participant display name and custom dish names in place; selected historical menu snapshots remain visible and stable. Save each edited participant card through `saveDiningOrder`.

**Step 4: Run tests and verify GREEN**

Run: `npm test -- --run tests/pages/dining-pages.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/dining-manage/index.vue tests/pages/dining-pages.test.js
git commit -m "feat: add dining invitation management"
```

### Task 8: Full verification and WeChat runtime review

**Files:**
- Review all files changed by Tasks 1–7.

**Step 1: Run the complete automated suite**

Run: `npm test -- --run`

Expected: all test files and tests pass with zero failures.

**Step 2: Check patch hygiene**

Run: `git diff --check`

Expected: no output.

**Step 3: Compile the development artifact**

Run: `npm run dev:mp-weixin`

Expected: uni-app reports successful compilation to `dist/dev/mp-weixin`. Stop the watcher after the success message.

Per workspace convention, do not run a local production build unless the user explicitly asks for it.

**Step 4: Verify generated cloud function contents**

Confirm `dist/dev/mp-weixin/cloudfunctions/two-person-menu-api` contains `index.js`, `binding.js`, `dining.js`, and `package.json`.

**Step 5: Inspect in WeChat Developer Tools**

Open `/Users/chenmingyu/code/two-person-menu/dist/dev/mp-weixin`, clear compile cache only if the directory rewrite triggers the known hot-reload race, and verify:

- owner home invitation card;
- create form and validation;
- management/share page;
- shared ordering page and manual dishes;
- repeated entry restoration in local mode;
- records list and photo UI;
- original “粤湘情 / 想吃这个” tab switching remains smooth.

Do not upload/deploy the cloud function or submit the mini program without the user's explicit go-ahead at that action point.

**Step 6: Final commit if verification produces fixes**

```bash
git add <only verified fix files>
git commit -m "fix: polish dining invitation flow"
```
