# 臺灣特有種鳥類觀測手札 Field Journal of Taiwan’s Endemic Birds

### 線上體驗  Live Demo
https://taiwan-endemic-birds-field-journal.vercel.app](https://taiwan-endemic-birds-field-journal.vercel.app

---

### 關於專案  About the Project

臺灣是一座充滿生命力的島嶼。高山、森林、溪流與海岸，孕育出許多獨一無二的生命，也因豐富的生態環境而享有「飛羽天堂」的美名，吸引無數賞鳥愛好者慕名而來。其中更有 32 種臺灣特有鳥類，僅棲息於這片土地。牠們有的穿梭於雲霧繚繞的山林，有的鳴唱於靜謐幽深的樹梢間，默默地生活在臺灣的各個角落。翻開這本《臺灣特有種鳥類觀測手札》，一起展開一場飛羽探索之旅吧。此應用程式旨在透過互動帶使用者認識在地生物多樣性。

Taiwan is a vibrant island ecosystem. From its towering alpine peaks and dense forests to its winding rivers and coastlines, this diverse landscape forms a thriving sanctuary widely celebrated as a "paradise for wild birds," drawing bird-watching enthusiasts from all over the world. Nestled within these habitats are 32 endemic bird species found nowhere else on Earth—some darting through misty canopies, others singing deep within secluded woodlands. 

Open this "Field Journal of Taiwan’s Endemic Birds" to embark on a journey of avian exploration. Designed as an interactive digital notebook, this application bridges ecological discovery with modern web tech to foster a deeper engagement with localized biodiversity.

---

### 技術架構  Technical Architecture

#### 前端架構  Frontend
* **框架與工具  Framework & Tooling**: React 19 (單頁應用程式 SPA), TypeScript, Vite
* **樣式與圖標  Styling & UI Components**: Tailwind CSS, Lucide React
* **動畫效果  Animation**: Motion
* **運作機制  Mechanism**: 
  採用 React 19 構建單頁應用程式 (SPA)，透過 HTML 進入點動態渲染編譯後的 TypeScript 模組。介面使用 Tailwind CSS 進行響應式排版，並結合 Motion 與 Lucide React 實現圖標互動與動態特效。
  
  The entry point loads via HTML, dynamically rendering compiled TypeScript modules. It implements responsive web design (RWD) for cross-device compatibility, alongside fluid UI interactions powered by Motion and Lucide React.

#### 後端運作  Backend
* **環境與框架  Runtime & Framework**: Node.js, Express
* **環境變數管理  Environment Variables**: `dotenv` (讀取 `.env.local` 配置 / Reads from `.env.local`)
* **安全架構  Security Architecture**: 
  專案內部整合 Express 框架建立後端伺服器環境。透過 `dotenv` 套件在伺服器端讀取 `.env.local` 檔案內的環境變數。所有與 AI 相關的請求皆採用伺服器端 (Server-Side) 運作架構，避免敏感的 API 金鑰暴露於前端瀏覽器。
  
  All AI-related requests are handled entirely on the server-side within an Express environment. This architecture secures sensitive credentials and ensures that no API keys are exposed to the client-side browser.

#### AI 功能來源  AI Integration
* **開發套件  SDK**: `@google/genai`
* **平台與模型  Platform & Model**: Google AI Studio (Gemini API)

  
  The backend safely calls the Gemini API via Google's official `@google/genai` SDK, executing core AI computational processing and interactive text-generation tasks based on bird observation informaion.

---

### 部署平台  Deployment

* **平台 / Platform**: Vercel
* **運作機制 / Mechanism**: 
  本專案之生產環境託管與自動化建置部署皆透過 Vercel 平台進行。
  
  The production environment is automatically built and securely deployed via Vercel's hosting platform.
