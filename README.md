**English** | [日本語](#japanese) | [简体中文](#chinese)

---

# SesnaQuake
A real-time earthquake alert app made by Domiko

> [!WARNING]
> SesnaQuake is **very new** and may contain numerous bugs. Please use with caution and report any issues you encounter.

> [!IMPORTANT]  
> Please review our documents before using SesnaQuake:
> - [Privacy Policy](privacy.md)  
> - [Terms of Use](terms.md)

---

## Features
- Real-time earthquake early warnings (EEW) with animated P/S wavefronts on an interactive map, driven by a real seismic travel-time model (TauP) with a switchable accurate/estimation mode
- Live shaking estimation map with regional intensity scales (JMA shindo, MMI, CSIS, CWA)
- Real-time seismic monitoring station data
- Home / Realtime / Past panel modes — auto-follow whatever's currently happening, pin to live alerts only, or browse and select past earthquake reports (updates the map focus, epicenter marker and shakemap)
- Voice announcements (TTS) and native OS notifications for new warnings
- 9 languages: English, 日本語, 简体中文, 繁體中文, Polski, Español, Italiano, 한국어, Português (Brasil)
- Customizable settings: map style, home location, timezone, voice engine, per-source data toggles, wave physics accuracy, notifications and more
- Runs as a native desktop app (Tauri + React)

---

## Data sources
All live data is aggregated directly in the app from:

**Earthquake early warnings (EEW)**
- [Wolfx](https://wolfx.jp/) – JMA-EEW (Japan), SEA-EEW (Sichuan), CENC-EEW (China), FEA-EEW (Fujian), CEAC-EEW (Chongqing)
- [Fan Studio](https://fanstudio.tech/) – KMA-EEW (South Korea)
- [ExpTech Studio](https://exptech.dev/) – CWA-EEW (Taiwan), with an NIED-based estimate as a fallback for Japan
- [USGS ShakeAlert](https://earthquake.usgs.gov/) – significant earthquakes (United States)

**Confirmed earthquake reports**
- [Wolfx CENC list](https://wolfx.jp/) – China
- [JMA](https://www.data.jma.go.jp/) – Japan, plus the shindo forecast-region boundaries used for the shaking-estimation map
- [EMSC](https://www.emsc-csem.org/) – worldwide
- [USGS](https://earthquake.usgs.gov/) – worldwide significant earthquakes
- [GeoNet](https://www.geonet.org.nz/) – New Zealand
- BREQ – Brazil
- [Fan Studio](https://fanstudio.tech/) – Taiwan (CWA) and South Korea (KMA), plus optional cross-check sources (off by default): BCSF (France), HKO (Hong Kong), GFZ (Germany), USP (Brazil), FSSN, and several Chinese provincial bureaus

**Monitoring stations**
- [NIED Kyoshin Monitor](http://www.kmoni.bosai.go.jp/) – Japan
- [ExpTech Studio](https://exptech.dev/) – Taiwan
- [P-ALERT](https://palert.earth.sinica.edu.tw/realtime) – Taiwan (delayed)

Additional services:
- [taup-js](https://www.npmjs.com/package/taup-js) – seismic travel-time model (TauP method) used for wavefront animation
- [geoBoundaries](https://www.geoboundaries.org/) – administrative boundary polygons used for the shaking-estimation map's MMI, CSIS and CWA regions

**References**
- Moratalla, Jose M., Goded, Tatiana, Rhoades, D., Canessa, Silvia, & Gerstenberger, Matthew. (2021). New Ground Motion to Intensity Conversion Equations (GMICEs) for New Zealand. *Seismological Research Letters*, 92, 448–459. https://doi.org/10.1785/0220200156 — used for the New Zealand-specific MMI conversion (GeoNet MMI)

---

## Development
```bash
npm run dev          # Vite dev server (web preview only, no Tauri window)
npm run build        # production web build → dist/
npm run tauri dev    # desktop app in dev mode
npm run tauri build  # desktop app production bundle
```

---

## My Social Media
- [Discord server](https://discord.gg/vnDfPRrRh8)  
- [YouTube channel](https://www.youtube.com/@DomikoLabs)

---

Sound effects & station intensities (images) by kotoho7, used under CC BY-SA 2.0
https://creativecommons.org/licenses/by-sa/2.0/

Earthquake alert tones (etws_earthquake.ogg, etws_default.ogg), converted to MP3, from the Android
Open Source Project (CellBroadcastReceiver), used under the Apache License 2.0
https://www.apache.org/licenses/LICENSE-2.0

---

<a id="japanese"></a>

[English](#sesnaquake) | **日本語** | [简体中文](#chinese)

# SesnaQuake（日本語）
Domiko が開発したリアルタイム地震アラートアプリ

> [!WARNING]
> SesnaQuake は**公開されたばかり**であり、多くのバグが含まれている可能性があります。ご注意の上ご利用いただき、問題を見つけた場合はご報告ください。

> [!IMPORTANT]  
> ご利用の前に以下のドキュメントをご確認ください：
> - [プライバシーポリシー](privacy.md)  
> - [利用規約](terms.md)

---

## 機能
- 緊急地震速報（EEW）のリアルタイム表示と、インタラクティブマップ上での P 波・S 波の伝播アニメーション（実際の地震波走時モデル TauP を使用し、精密／簡易推定モードを切り替え可能）
- 地域ごとの震度スケール（気象庁震度・MMI・CSIS・CWA）に対応した揺れ推定マップ
- リアルタイムの地震観測点データ
- ホーム／リアルタイム／過去 の3つの表示モード — 現在の状況を自動追従するモード、緊急地震速報のみを固定表示するモード、過去の地震情報を閲覧・選択できるモード（選択に応じて地図の表示位置、震源マーカー、揺れ推定マップも更新されます）
- 新しい速報の音声読み上げ（TTS）とOS通知
- 9 言語対応：English、日本語、简体中文、繁體中文、Polski、Español、Italiano、한국어、Português (Brasil)
- カスタマイズ可能な設定：地図スタイル、自宅の位置、タイムゾーン、音声エンジン、データソースごとのオン・オフ、波動物理モデルの精度、通知など
- ネイティブデスクトップアプリとして動作（Tauri + React）

---

## データソース
すべてのライブデータはアプリ内で直接集約されています：

**緊急地震速報（EEW）**
- [Wolfx](https://wolfx.jp/) – JMA-EEW（日本）、SEA-EEW（四川）、CENC-EEW（中国）、FEA-EEW（福建）、CEAC-EEW（重慶）
- [Fan Studio](https://fanstudio.tech/) – KMA-EEW（韓国）
- [ExpTech Studio](https://exptech.dev/) – CWA-EEW（台湾）、日本向けの NIED ベース推定フォールバック付き
- [USGS ShakeAlert](https://earthquake.usgs.gov/) – 主要地震（アメリカ合衆国）

**確定地震情報**
- [Wolfx CENC リスト](https://wolfx.jp/) – 中国
- [JMA](https://www.data.jma.go.jp/) – 日本、および揺れ推定マップで使用する気象庁震度予報区分の境界データ
- [EMSC](https://www.emsc-csem.org/) – 世界
- [USGS](https://earthquake.usgs.gov/) – 世界の主要地震
- [GeoNet](https://www.geonet.org.nz/) – ニュージーランド
- BREQ – ブラジル
- [Fan Studio](https://fanstudio.tech/) – 台湾（CWA）と韓国（KMA）、および任意のクロスチェック用ソース（デフォルトでオフ）：BCSF（フランス）、HKO（香港）、GFZ（ドイツ）、USP（ブラジル）、FSSN、中国の複数の省級機関

**観測点データ**
- [NIED 強震モニタ](http://www.kmoni.bosai.go.jp/) – 日本
- [ExpTech Studio](https://exptech.dev/) – 台湾
- [P-ALERT](https://palert.earth.sinica.edu.tw/realtime) – 台湾（遅延あり）

その他のサービス：
- [taup-js](https://www.npmjs.com/package/taup-js) – 波面アニメーションに使用する地震波走時モデル（TauP法）
- [geoBoundaries](https://www.geoboundaries.org/) – 揺れ推定マップの MMI・CSIS・CWA 区分で使用する行政境界データ

**参考文献**
- Moratalla, Jose M., Goded, Tatiana, Rhoades, D., Canessa, Silvia, & Gerstenberger, Matthew. (2021). New Ground Motion to Intensity Conversion Equations (GMICEs) for New Zealand. *Seismological Research Letters*, 92, 448–459. https://doi.org/10.1785/0220200156 — ニュージーランド固有の MMI 変換（GeoNet MMI）に使用

---

## 開発
```bash
npm run dev          # Vite 開発サーバー（Tauri なしの Web プレビュー）
npm run build        # 本番 Web ビルド → dist/
npm run tauri dev    # デスクトップアプリの開発モード
npm run tauri build  # デスクトップアプリの本番ビルド
```

---

## SNS
- [Discord サーバー](https://discord.gg/vnDfPRrRh8)  
- [YouTube チャンネル](https://www.youtube.com/@DomikoLabs)

---

効果音および観測点震度（画像）は kotoho7 氏によるもので、CC BY-SA 2.0 ライセンスの下で使用しています
https://creativecommons.org/licenses/by-sa/2.0/

地震警報音（etws_earthquake.ogg、etws_default.ogg）は Android Open Source Project（CellBroadcastReceiver）由来のもので、MP3 形式に変換の上、Apache License 2.0 の下で使用しています
https://www.apache.org/licenses/LICENSE-2.0

---

<a id="chinese"></a>

[English](#sesnaquake) | [日本語](#japanese) | **简体中文**

# SesnaQuake（简体中文）
由 Domiko 开发的实时地震警报应用

> [!WARNING]
> SesnaQuake **刚刚发布**，可能存在许多 bug。请谨慎使用，如遇到问题请及时反馈。

> [!IMPORTANT]  
> 使用 SesnaQuake 前请先阅读以下文档：
> - [隐私政策](privacy.md)  
> - [使用条款](terms.md)

---

## 功能
- 实时地震预警（EEW），在交互式地图上显示 P 波 / S 波传播动画，基于真实地震波走时模型（TauP），可在设置中切换精确/估算模式
- 基于各地区烈度标准（日本气象厅震度、MMI、CSIS、CWA）的震感估计地图
- 实时地震监测站数据
- 主页 / 实时 / 历史 三种显示模式 — 自动跟随最新动态、仅固定显示实时预警、或浏览并选择历史地震报告（选择后会同步更新地图焦点、震中标记和震感地图）
- 新预警的语音播报（TTS）与系统通知
- 支持 9 种语言：English、日本語、简体中文、繁體中文、Polski、Español、Italiano、한국어、Português (Brasil)
- 可自定义设置：地图样式、家庭位置、时区、语音引擎、各数据源开关、波动物理精度、通知等
- 以原生桌面应用运行（Tauri + React）

---

## 数据来源
所有实时数据均在应用内直接聚合，来自以下来源：

**地震预警（EEW）**
- [Wolfx](https://wolfx.jp/) – JMA-EEW（日本）、SEA-EEW（四川）、CENC-EEW（中国）、FEA-EEW（福建）、CEAC-EEW（重庆）
- [Fan Studio](https://fanstudio.tech/) – KMA-EEW（韩国）
- [ExpTech Studio](https://exptech.dev/) – CWA-EEW（台湾），并以基于 NIED 的估算作为日本的备用来源
- [USGS ShakeAlert](https://earthquake.usgs.gov/) – 重要地震（美国）

**确认地震报告**
- [Wolfx CENC 列表](https://wolfx.jp/) – 中国
- [JMA](https://www.data.jma.go.jp/) – 日本，以及震感估计地图中使用的气象厅震度预报分区边界数据
- [EMSC](https://www.emsc-csem.org/) – 全球
- [USGS](https://earthquake.usgs.gov/) – 全球重要地震
- [GeoNet](https://www.geonet.org.nz/) – 新西兰
- BREQ – 巴西
- [Fan Studio](https://fanstudio.tech/) – 台湾（CWA）与韩国（KMA），以及可选的交叉校验来源（默认关闭）：BCSF（法国）、HKO（香港）、GFZ（德国）、USP（巴西）、FSSN、中国多个省级地震局

**监测站数据**
- [NIED 监测站](http://www.kmoni.bosai.go.jp/) – 日本
- [ExpTech Studio](https://exptech.dev/) – 台湾
- [P-ALERT 监测站](https://palert.earth.sinica.edu.tw/realtime) – 台湾（延迟）

其他服务：
- [taup-js](https://www.npmjs.com/package/taup-js) – 用于波前动画的地震波走时模型（TauP 方法）
- [geoBoundaries](https://www.geoboundaries.org/) – 用于震感估计地图 MMI、CSIS、CWA 区分的行政区划边界数据

**参考文献**
- Moratalla, Jose M., Goded, Tatiana, Rhoades, D., Canessa, Silvia, & Gerstenberger, Matthew. (2021). New Ground Motion to Intensity Conversion Equations (GMICEs) for New Zealand. *Seismological Research Letters*, 92, 448–459. https://doi.org/10.1785/0220200156 — 用于新西兰专属的 MMI 换算（GeoNet MMI）

---

## 开发
```bash
npm run dev          # Vite 开发服务器（不含 Tauri 窗口的 Web 预览）
npm run build        # 生产 Web 构建 → dist/
npm run tauri dev    # 桌面应用开发模式
npm run tauri build  # 桌面应用生产构建
```

---

## 我的社交媒体
- [Discord 服务器](https://discord.gg/vnDfPRrRh8)  
- [YouTube 频道](https://www.youtube.com/@DomikoLabs)

---

音效与监测站烈度（图像）由 kotoho7 制作，基于 CC BY-SA 2.0 许可使用
https://creativecommons.org/licenses/by-sa/2.0/

地震警报音（etws_earthquake.ogg、etws_default.ogg）来自 Android Open Source Project（CellBroadcastReceiver），已转换为 MP3 格式，基于 Apache License 2.0 许可使用
https://www.apache.org/licenses/LICENSE-2.0
