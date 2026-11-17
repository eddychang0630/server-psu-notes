# 伺服器電源 (Server PSU) 電路自學講義

從 AC 插座到 12 V 輸出，逐級拆解伺服器電源（CRPS / M-CRPS 類 2000 W 熱插拔電源）的電路：工作原理、設計公式、元件選用、波形與互動計算器。純靜態網站，適合用 iPhone / iPad 閱讀。

## 章節

| # | 檔案 | 內容 |
|---|------|------|
| 00 | `index.html` | 首頁、整機方塊圖、學習地圖 |
| 01 | `ch01-overview.html` | 伺服器電源總覽、CRPS、80 PLUS、冗餘、損失預算 |
| 02 | `ch02-basics.html` | Buck / Boost / Buck-Boost 基礎（伏秒平衡、CCM/DCM、計算器） |
| 03 | `ch03-ac-input.html` | 保險絲、MOV、NTC + 繼電器、X 電容放電、輸入偵測 |
| 04 | `ch04-emi.html` | EMI 濾波器（共模/差模、X/Y 電容、設計步驟） |
| 05 | `ch05-pfc.html` | PFC（Boost PFC、平均電流控制、交錯、圖騰柱無橋） |
| 06 | `ch06-bulk.html` | Bulk 電容、Hold-up、漣波與壽命 |
| 07 | `ch07-llc.html` | LLC 諧振轉換器（工作原理、波形、FHA、設計步驟、變壓器、時域模擬器） |
| 08 | `ch08-secondary.html` | 同步整流、輸出濾波、ORing、均流、熱插拔 |
| 09 | `ch09-standby.html` | 待機 Flyback |
| 10 | `ch10-control.html` | 迴路補償、TL431 + 光耦 |
| 11 | `ch11-digital.html` | 數位控制、PMBus、風扇 |
| 12 | `ch12-protection.html` | 保護、感測、上電時序 |
| 13 | `ch13-components.html` | 元件百科 |
| 14 | `ch14-layout.html` | 佈局、散熱、EMC、安規 |
| 15 | `ch15-design.html` | 2000 W 設計實例總整理 |
| ★ | `references.html` | 參考資源、名詞對照 |

## 發佈到 GitHub Pages

1. 在 GitHub 建立一個新的 repository（例如 `server-psu-notes`）。
2. 把這個資料夾的所有檔案推上去（`.claude/` 資料夾是本機預覽設定，可以不上傳）：

   ```bash
   git init
   git add index.html ch*.html references.html assets README.md .nojekyll
   git commit -m "Server PSU notes"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/server-psu-notes.git
   git push -u origin main
   ```

3. 到 repository 的 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`，儲存。
4. 約一分鐘後網址會是 `https://<你的帳號>.github.io/server-psu-notes/`。
5. 在 iPhone / iPad 的 Safari 開啟後，點「分享 → 加入主畫面」，就能像 App 一樣全螢幕閱讀。

## 本機預覽

```bash
python -m http.server 8765
```

然後開啟 <http://localhost:8765>。（直接雙擊 HTML 也能看，但部分瀏覽器對本機檔案有限制，建議用上面的方式。）

## 技術說明

- 純 HTML / CSS / JavaScript，無需建置。
- 數學公式使用 [KaTeX](https://katex.org/)（由 cdnjs 載入，需連網）。
- 電路圖、波形圖、互動計算器為本講義原創，以 CC BY 4.0 授權。
- 元件照片以熱連結方式引用自 Wikimedia Commons，作者與授權標示於每張照片下方。
- 支援深色模式、手機/平板版面、圖片點擊放大（可雙指縮放）。

> 內容供學習用途；實際產品設計請以最新的規格書、標準與元件規格書為準。伺服器電源內含致命高壓，實作與量測請注意安全。
