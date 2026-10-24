# 泰拉征募

一个无需安装的明日方舟随机 12 人抽卡网页，内置 PRTS「干员一览」中的 434 名实装干员。

在线使用：[泰拉征募](https://celiniatexas.github.io/terra-recruit/)

## 手机与 GitHub Pages

网页版支持手机触控布局、主屏幕图标和离线缓存。部署到 GitHub Pages 后，可以直接在手机浏览器访问，也可以“添加到主屏幕”当作 App 使用。详细步骤见 [DEPLOY.md](DEPLOY.md)。

## 使用方法

双击 `index.html`，或右键选择用浏览器打开。程序离线运行，不依赖服务器或前端构建工具。

- 固定一次抽取 12 名干员。
- 可为 8 个职业分别设置最低人数和最高人数。
- 医疗最多 2 名，程序会阻止设置为 3 名或更多。
- 默认不重复；关闭后允许同一名干员重复出现。
- “基础均衡”和“双医疗”可一键应用常用条件。
- 抽取后可保留想要的干员，只重抽未保留的位置。
- 星数按游戏内实际星级显示，范围为一星至六星。
- 抽取后可以复制完整名单。
- 键盘按 `D` 可直接抽取。

名单同步日期为 **2026-10-24**，候选池共 **434 名**干员，数据来自 [PRTS 干员一览](https://prts.wiki/w/干员一览)。

## 更新名单

PRTS 更新后，重新运行 `update-operators.ps1` 即可刷新 `data.js`：

```powershell
powershell -ExecutionPolicy Bypass -File .\update-operators.ps1
```

脚本只读取 PRTS 的公开 Cargo 数据，并保留 `data.js` 的数据格式。
