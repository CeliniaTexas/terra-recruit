# 泰拉征募

一个无需安装的明日方舟随机 12 人抽卡网页，内置 PRTS「干员一览」中的 434 名实装干员。

## Windows 便携版

直接运行 [dist/Terra-Recruit-1.0.0.exe](dist/Terra-Recruit-1.0.0.exe)。这是一个约 374 KB 的单文件程序，网页和数据均已打包在 EXE 内，发给其他人时只需要发送这一个文件。

程序使用 Windows 10/11 自带的 Microsoft Edge 内核显示界面，不需要安装 Node.js、Python 或其他运行环境。因为当前版本没有购买代码签名证书，若文件通过网络下载后被 SmartScreen 提示，可点击“更多信息”再选择“仍要运行”。

## 手机与 GitHub Pages

网页版支持手机触控布局、主屏幕图标和离线缓存。部署到 GitHub Pages 后，可以直接在手机浏览器访问，也可以“添加到主屏幕”当作 App 使用。详细步骤见 [DEPLOY.md](DEPLOY.md)。

## 使用方法

双击 `index.html`，或右键选择用浏览器打开。程序离线运行，不依赖服务器或前端构建工具。

- 固定一次抽取 12 名干员。
- 可为 8 个职业分别设置最低人数和最高人数。
- 医疗最多 2 名，程序会阻止设置为 3 名或更多。
- 默认不重复；关闭后允许同一名干员重复出现。
- “基础均衡”和“双医疗”可一键应用常用条件。
- 抽取后可以复制完整名单。
- 键盘按 `D` 可直接抽取。

名单同步日期为 **2026-10-24**，候选池共 **434 名**干员，数据来自 [PRTS 干员一览](https://prts.wiki/w/干员一览)。

## 更新名单

PRTS 更新后，重新运行 `update-operators.ps1` 即可刷新 `data.js`：

```powershell
powershell -ExecutionPolicy Bypass -File .\update-operators.ps1
```

脚本只读取 PRTS 的公开 Cargo 数据，并保留 `data.js` 的数据格式。
