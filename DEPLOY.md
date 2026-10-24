# 手机访问与 GitHub Pages

## 最简单的方式

1. 新建一个 GitHub 仓库，例如 `terra-recruit`。
2. 把本项目根目录的文件上传到仓库的 `main` 分支。
3. 打开仓库的 **Settings → Pages**。
4. 在 **Build and deployment → Source** 中选择 **Deploy from a branch**。
5. 分支选择 `main`，目录选择 `/(root)`，然后保存。
6. 等 GitHub 完成部署后，地址通常是：

   `https://你的用户名.github.io/terra-recruit/`

这个网站由 GitHub 免费托管，不需要购买服务器。GitHub Pages 是公开静态网站，免费账户通常需要使用公开仓库。

项目还包含 `.github/workflows/pages.yml`。如果想使用自动构建，也可以在 Pages 设置中选择 **GitHub Actions**，之后每次推送都会自动发布。

## 手机上使用

部署完成后，在手机浏览器中打开网址：

- iPhone / iPad：Safari 点击分享按钮，再选“添加到主屏幕”。
- Android：Chrome 或 Edge 菜单中选择“安装应用”或“添加到主屏幕”。

安装后会像普通 App 一样从桌面启动。第一次联网打开后，程序会缓存干员名单和抽卡页面，之后断网也能继续抽取。

## 更新干员名单

在本机运行 `update-operators.ps1` 更新 `data.js`，再把修改后的文件提交到 GitHub。GitHub Actions 会自动重新发布网站。
