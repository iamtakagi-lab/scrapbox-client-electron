/**
 * 参照: Scrapbox API Documents
 * https://scrapbox.io/scrapboxlab/API
 * https://scrapbox.io/scrapboxlab/Scrapbox_REST_API%E3%81%AE%E4%B8%80%E8%A6%A7
 * https://scrapbox.io/help-jp/API
 */

// 参照: https://github.com/discordjs/RPC/blob/master/example/main.js

import { app, BrowserWindow } from "electron";
import { RPC } from "./rpcLoader";
import fetch from "electron-fetch";

let mainWindow: BrowserWindow | undefined;
const clientId = "1008185846496763986";
let rpc: RPC.Client | undefined;
let startTimestamp: number;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.setTitle("Scarpbox");
  mainWindow.loadURL("https://scrapbox.io");

  // ページ遷移 (参照: https://stackoverflow.com/questions/67743453/how-to-switch-electron-between-windows-with-false-or-true-frame-depending-on-th)
  mainWindow.webContents.on("did-navigate-in-page", async (event) => {
    if (!mainWindow) return;

    console.log("did-navigate-in-page");

    const pageUrl = mainWindow.webContents.getURL();

    pageSize = await getPageSize(); // ページ数を再取得

    const slug = pageUrl.split("/").slice(-1)[0];
    if (!slug || !slug.length) {
      currentPage = undefined;
      return;
    }
    currentPage = await getPageData(slug);
    console.log("ok");
  });

  mainWindow.once("ready-to-show", () => {
    const i = setInterval(async () => {
      await init();
      rpc = new RPC.Client({ transport: "ipc" });
      RPC.register(clientId);

      rpc.on("ready", () => {
        startTimestamp = Date.now();
        setActivity();
        setInterval(() => {
          setActivity();
        }, 1000);
      });

      rpc.login({ clientId }).catch(console.error);
      clearInterval(i);
    }, 1000);
  });

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

app.on("ready", () => {
  createMainWindow();
});

app.on("window-all-closed", () => {
  if (rpc) {
    rpc.destroy();
  }
  app.quit();
});

app.on("activate", () => {
  if (!mainWindow) {
    createMainWindow();
  }
});

/**
 * 画像が存在するか
 * @param url 画像のURL
 * @returns
 */
function isExistsImg(url: string) {
  return new Promise<boolean>((resolve) => {
    fetch(url, { method: "HEAD" })
      .then((res) => {
        resolve(res.ok);
      })
      .catch((err) => resolve(false));
  });
}

let projectName: string | undefined; // Scrapbox Project Name
let projectIcon: string =
  "https://i.gyazo.com/160b81da1cc7cdc1ff87b974914eb15b.png"; // Scrapbox Project Icon
let pageSize: number = 0;
let currentPage: any | undefined

async function getPageSize() {
  if (!projectName) return;
  return fetch(`https://scrapbox.io/api/pages/${projectName}`).then(
    async (res) => await (await res.json())["count"]
  );
}

async function getPageData(slug: string) {
  if (!projectName) return;
  return (
    await fetch(`https://scrapbox.io/api/pages/${projectName}/${slug}`)
  ).json();
}

/**
 * 初期化
 */
async function init() {
  if (!mainWindow) return;

  const pageUrl = mainWindow.webContents.getURL();
  console.log("url: " + pageUrl);
  projectName = pageUrl.split("/").slice(-2)[0];
  console.log("projectName: " + projectName);
  projectIcon = `https://scrapbox.io/api/pages/${projectName}/${projectName}/icon`;
  console.log("projectIcon: " + projectIcon);

  pageSize = await getPageSize();
}

async function setActivity() {
  if (!rpc || !mainWindow || !projectName || !projectIcon) return;

  const pageUrl = mainWindow.webContents.getURL();

  const buttons = [
    { label: "View Scrapbox", url: `https://scrapbox.io/${projectName}/` },
  ];

  if (pageUrl) {
    buttons.push({ label: "View Page", url: pageUrl });
  }

  let largeImage: string = "";
  const slug = pageUrl.split("/").slice(-1)[0];
  console.log("slug: " + slug);

  if (!slug || !slug.length) {
    largeImage = projectIcon; // Slug ページで無いとき
  } else {
    const slugImage = `https://scrapbox.io/api/pages/${projectName}/${slug}/icon`;

    if (await isExistsImg(slugImage)) {
      largeImage = slugImage;
    } else {
      largeImage = "https://i.gyazo.com/6263c49e8c9ece818502922f63adbdf3.jpg"; // No Image
    }
  }

  console.log(currentPage);

  rpc.setActivity({
    details: `${
      mainWindow.webContents.getTitle() === projectName
        ? "Home"
        : mainWindow.webContents.getTitle()
    } ${currentPage ? `(` + (currentPage.lines.length) + ` lines)` : ""}`,
    state: `${
      mainWindow.webContents.getTitle() === projectName ? "" : "Editing..."
    } (Total: ${pageSize} pages)`,
    startTimestamp,
    largeImageKey: largeImage,
    largeImageText: projectName,
    smallImageKey: "https://i.gyazo.com/b0cbad6c8138bd8a8447a329aa020c46.png",
    smallImageText: "Scrapbox",
    instance: false,
    buttons,
  });

  console.log("page title: " + mainWindow.webContents.getTitle());
}
