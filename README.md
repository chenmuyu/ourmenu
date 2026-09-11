# 两人菜单

一个使用 UniApp Vue 3 + JavaScript 开发的微信小程序，用来记录固定两个人各自做过的菜。

## 已实现

- 首页固定展示两位掌勺人的头像与名字
- 点击掌勺人切换菜单，菜单面板只列菜名
- 菜名左滑露出删除按钮，删除前二次确认
- 首页支持通过微信右上角菜单转发给朋友
- 新增、编辑和删除菜单记录
- 一张封面图与最多九张详情图
- 菜品详情大图预览、日期和备注
- 两人自行修改名字和上传头像
- 本地体验仓储与微信云开发仓储切换
- 云函数限制菜单册只能绑定两个微信用户

## 本地启动

```bash
npm install
npm run dev:mp-weixin
```

然后在微信开发者工具中导入：

```text
/Users/chenmingyu/code/two-person-menu/dist/dev/mp-weixin
```

编译时会自动把 `cloudfunctions` 同步到这个最终产物目录，并写入微信开发者工具需要的 `cloudfunctionRoot` 配置。

未配置 `.env.local` 时使用本地体验数据，适合先看界面与操作流程。配置云环境的方法见 [微信云开发接入](docs/cloud-development.md)。

## 测试

```bash
npm run test:run
```

当前单元测试覆盖菜单筛选排序、必填校验、固定两人约束、本地持久化与图片上传回退规则。
