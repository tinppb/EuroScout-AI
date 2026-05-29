<p align="center">
  <img src="public/favicon.svg" width="80" alt="EuroScout AI Logo" />
</p>

<h1 align="center">EuroScout AI</h1>

<p align="center">
  <strong>Interactive Football Player Analytics Dashboard</strong><br/>
  Tìm kiếm cầu thủ tương tự, so sánh chỉ số & khám phá dữ liệu Big 5 giải VĐQG châu Âu qua các mùa giải 2023–2026.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Chart.js-4.4-FF6384?logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/Vanilla_JS-ES2024-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Data-Sofascore-00C853" alt="Data Source" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Demo & Screenshots](#-demo--screenshots)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc dự án](#-kiến-trúc-dự-án)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Data Pipeline](#-data-pipeline)
- [Similarity Engine](#-similarity-engine)
- [API Backend (Tùy chọn)](#-api-backend-tùy-chọn)
- [Đóng góp](#-đóng-góp)


---

## Tổng quan

**EuroScout AI** là một dashboard phân tích cầu thủ bóng đá tương tác, được xây dựng dưới dạng Single Page Application (SPA). Ứng dụng giúp người dùng — scout, nhà phân tích, hoặc fan bóng đá — khám phá và so sánh hàng nghìn cầu thủ từ **5 giải đấu hàng đầu châu Âu**:

| Giải đấu | Quốc gia |
|---|---|
|  Premier League | Anh |
|  La Liga | Tây Ban Nha |
|Bundesliga | Đức |
| Serie A | Ý |
| Ligue 1 | Pháp |

Toàn bộ dữ liệu là **per-90 minutes stats** (chỉ số trung bình mỗi 90 phút thi đấu) từ các mùa giải **23/24, 24/25, 25/26**, được thu thập từ **Sofascore**. Tích hợp bộ lọc mùa giải động cho phép so sánh cầu thủ qua nhiều năm hoặc gộp chung (All Seasons).

---

## Tính năng

### Dashboard
- Hỗ trợ đa mùa giải (Multi-season support) với thanh chọn Mùa Giải linh hoạt
- Tổng quan số lượng cầu thủ, giải đấu, đội bóng
- Phân bố cầu thủ theo giải đấu & vị trí (FW / MF / DF / GK)
- Bảng xếp hạng nhanh: **Top Rated**, **Top Scorers**, **Top Assists** (per 90)

### Similar Player Finder
- Tìm cầu thủ có phong cách & chỉ số tương đồng bằng **Cosine Similarity + Z-score Normalization**
- Bộ lọc linh hoạt: theo giải đấu, vị trí, chế độ cross-league
- Quick search buttons cho các cầu thủ phổ biến
- **Radar Chart** so sánh percentile trực quan

### Player Comparison
- So sánh head-to-head giữa 2 cầu thủ bất kỳ
- Hiển thị chỉ số theo từng nhóm: Attacking, Creativity, Passing, Defending, Dribbling, Duels, Discipline
- Radar chart overlay với percentile

### Scatter Explorer
- Biểu đồ phân tán tương tác (scatter plot) với 8+ presets có sẵn
- Tùy chọn trục X/Y từ 40+ chỉ số
- Lọc theo giải đấu & vị trí
- Hover để xem chi tiết cầu thủ

### Rankings
- Bảng xếp hạng cầu thủ theo bất kỳ chỉ số nào
- Sắp xếp, lọc theo giải đấu & vị trí
- Phân trang và highlight top players

### Heatmap
- Ma trận nhiệt (heatmap) so sánh chỉ số giữa các cầu thủ
- Trực quan hóa pattern & outlier trong dữ liệu

### UX/UI
- Dark mode thiết kế glassmorphism hiện đại
- Responsive trên mọi kích thước màn hình
- Sidebar thu gọn được (desktop) & menu mobile
- Micro-animations mượt mà
- Global search với autocomplete
- Font chữ: **Inter** (body) + **Outfit** (heading)

---

## Demo & Screenshots

> *Chạy local với `npm run dev` và truy cập `http://localhost:3000` để trải nghiệm.*
![alt text](/src/images/image-demo.png)
---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Language** | Vanilla JavaScript (ES Modules) |
| **Styling** | Vanilla CSS (Custom Properties, Glassmorphism) |
| **Charts** | [Chart.js 4.4](https://www.chartjs.org/) + [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/) |
| **Typography** | Google Fonts (Inter, Outfit) |
| **Data Source** | Sofascore (crawled & processed) |


---

## Kiến trúc dự án

```
EuroScout AI/
├── public/
│   └── favicon.svg              
├── scripts/
│   └── build-data.mjs           
├── src/
│   ├── api/
│   │   └── client.js            
│   ├── charts/
│   │   ├── heatmapChart.js      
│   │   ├── radarChart.js        # Radar/spider chart component
│   │   └── scatterChart.js      # Scatter plot component
│   ├── data/
│   │   ├── dataStore.js         # Data store, utilities, stat configs
│   │   └── players.json         
│   │   └── similarity.js        # Cosine similarity engine
│   ├── styles/
│   │   └── index.css            
│   ├── views/
│   │   ├── dashboard.js         # Dashboard overview
│   │   ├── similarFinder.js     # Similar player finder
│   │   ├── comparison.js        # Head-to-head comparison
│   │   ├── scatterExplorer.js   # Scatter plot explorer
│   │   ├── rankings.js          # Player rankings table
│   │   └── heatmap.js           # Heatmap visualization
│   └── main.js                  # Entry point, SPA router, global search
├── index.html                   # Shell HTML
├── vite.config.js               # Vite configuration
├── package.json
└── README.md
```

---

## Cài đặt & Chạy

### Yêu cầu

- **Node.js** ≥ 18
- **npm** ≥ 9

### Bước 1: Clone repository

```bash
git clone https://github.com/tinppb/EuroScout-AI.git
cd EuroScout-AI
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ tự mở tại **http://localhost:3000**.

### Bước 4: Build Production

```bash
npm run build
npm run preview    # Preview bản build
```

Thư mục `dist/` sẽ chứa bản build tối ưu, sẵn sàng deploy.

---

## Data Pipeline

Dữ liệu được xử lý qua script `scripts/build-data.mjs`:

```
CSV files (Sofascore)  →  build-data.mjs  →  src/data/players.json
```

### Quy trình

1. **Thu thập dữ liệu**: Crawl per-90 stats từ Sofascore cho 5 giải đấu qua 3 mùa giải ([Top5-Leagues-Scraper-25-26](https://github.com/tinppb/Top5-Leagues-Scraper-25-26))
2. **Xử lý CSV**: Script tự động quét và đọc toàn bộ file CSV của các giải đấu và mùa giải
3. **Lọc**: Loại bỏ cầu thủ có < 270 phút thi đấu (≈ 3 trận)
4. **Chuẩn hóa**: Trích xuất tự động "League" và "Season" từ tên file, chuẩn hóa vị trí, fix encoding
5. **Xuất**: Ghi ra `players.json` với metadata đa mùa giải + toàn bộ cầu thủ

### Chạy lại pipeline (nếu có dữ liệu mới)

```bash
node scripts/build-data.mjs
```

>  **Lưu ý**: Cần có thư mục dữ liệu CSV gốc tại đường dẫn được cấu hình trong `build-data.mjs`.

---

##  Similarity Engine

Module `src/engine/similarity.js` thực hiện tìm cầu thủ tương đồng với thuật toán:

### Thuật toán

1. **Chọn features theo vị trí**: Mỗi vị trí (FW/MF/DF/GK) sử dụng tập chỉ số riêng phù hợp
2. **Z-score Normalization**: Chuẩn hóa dữ liệu để loại bỏ ảnh hưởng scale khác nhau giữa các chỉ số
3. **Cosine Similarity**: Tính độ tương đồng giữa vector chỉ số của 2 cầu thủ (0–100%)
4. **Xếp hạng**: Sắp xếp theo điểm similarity giảm dần

### Features theo vị trí

| Vị trí | Chỉ số tiêu biểu |
|---|---|
| **FW** | Goals, xG, Shots, Dribbles, Key Passes, Aerial % |
| **MF** | Goals, Assists, Pass Acc.%, Tackles, Interceptions, Long Balls |
| **DF** | Tackles, Interceptions, Clearances, Aerial %, Duels, Pass Acc.% |
| **GK** | Clean Sheets, Pass Acc.%, Long Ball %, Aerial % |

### Bộ lọc hỗ trợ

- Lọc theo giải đấu cụ thể
- Lọc theo vị trí
- Chế độ cross-league (chỉ hiển thị cầu thủ từ giải khác)
- Loại trừ đồng đội
- Phút thi đấu tối thiểu

---

## API Backend 

Ứng dụng hoạt động hoàn toàn **client-side** mà không cần backend. Tuy nhiên, một API backend Python (FastAPI) có thể được kết nối để mở rộng tính năng:

| Endpoint | Mô tả |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/similar` | Tìm cầu thủ tương tự (sklearn) |
| `GET /api/percentiles/:id` | Percentile ranking |
| `GET /api/pca` | PCA 2D cho scatter plot |
| `GET /api/clusters` | KMeans cluster summaries |
| `GET /api/stats/leagues` | Thống kê tổng hợp theo giải |
| `GET /api/players` | Tìm kiếm cầu thủ |
| `GET /api/players/:id` | Chi tiết cầu thủ |

> Khi backend không khả dụng, ứng dụng tự động fallback sang xử lý client-side.

---

## Đóng góp

Mọi đóng góp xin vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request



<p align="center">
  tinppb
</p>
