# 🛍️ Product Aggregator AI

**Intelligent, Multimodal Product Search Engine**  
Seamlessly search and compare products using **text or images**, powered by **LLaMA-3**, **CLIP**, **Serper**, and **Daraz**.

![banner](https://user-images.githubusercontent.com/your-banner-here) <!-- Optional: Use a visual here -->

---

## 🚀 Features

- 🔎 **Text Search** → Enriched via LLaMA-3 prompt engineering
- 🖼️ **Image Search** → Uses BLIP captioning, OCR, CLIP vector matching
- 🧠 **LLM Integration** → Core term extraction, keyword enrichment
- 📦 **Live Price Scraping** from:
  - Daraz (headless Selenium)
  - Generic e-commerce via Serper (Google Search API)
- 🖼️ **Image Handling**
  - AVIF/WebP conversion
  - Downloads thumbnails and big images
- 🧪 **Vector Ranking** via TF-IDF and CLIP similarity

---

## 🗂️ Project Structure

```
ProductAggregator/
├── main.py               # CLI Entry: Search via text or image
├── .env                 # Environment secrets (API keys)
├── requirements.txt     # Python dependencies
├── .gitignore           # Git exclusion rules
├── logs/                # Logging output
├── data/                # Scraped products and images
├── src/                 # Core modules
│   ├── daraz_scraper.py
│   ├── generic_scraper.py
│   ├── image_search.py
│   ├── query_llm.py
│   ├── vectorizer.py
│   ├── remote_vision.py
│   └── ocr_utils.py
├── frontend/            # UI components
│   ├── streamlit/       # Streamlit UI (in development)
│   └── react-ui/       # Planned React frontend
├── docker/              # Dockerfile & Compose (coming soon)
└── README.md
```

---

## 🧪 Requirements

- Python 3.10+
- Chrome (for headless scraping)
- `.env` file with API keys
- HuggingFace account
- Serper.dev API key

---

## 🔐 .env Template

```
# APIs
SERPER_API_KEY=your_serper_api_key_here
HF_TOKEN=your_huggingface_token_here

# Optional proxy
PROXY=socks5h://127.0.0.1:9050
```

---

## 🧰 Installation

```bash
# Clone the repo
git clone https://github.com/your-username/ProductAggregator.git
cd ProductAggregator

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API keys in .env
```

---

## 🕹️ Usage

### 💬 Text Search
```bash
python main.py

# In CLI:
Search by (T)ext / (I)mage / (Q)uit? T
Enter product keywords: Apple iPhone 14
```

### 🖼️ Image Search
```bash
Search by (T)ext / (I)mage / (Q)uit? I
Enter image path: path/to/shoe.jpg
```

Products will be shown in ranked format with source, price, and URL.

---

## 🧠 LLM + CLIP + OCR Pipeline

**Text Flow**:  
User Query → LLaMA-3 → Core Term + Categories → Serper Query → Daraz + Web Scraping → Vectorization → Top Results

**Image Flow**:  
Image → BLIP Caption + OCR → Focused LLaMA Prompt → Serper + Daraz Queries → Product Images → CLIP Similarity → Ranked List

---

## 🐳 Docker Setup (optional)

Coming soon:
- Dockerfile for backend
- `docker-compose.yml` to launch scraper + Streamlit UI
- Multi-stage build with HF token + Serper config

---

## 🧑‍💻 Frontend (in progress)

### 🎈 Streamlit UI
Located in `frontend/streamlit`. Planned features:
- Intuitive 2-panel layout (search form + results)
- Auto-show image previews, prices, URLs
- Responsive, light/dark theme toggle
- Search history panel

### 💡 React Frontend (planned)
Goal: IDEALO-inspired experience  
Reference: [https://www.idealo.de/](https://www.idealo.de/)  
Features will include:
- Persistent state (favorite products)
- Multi-store comparison grid
- Deep filter capability (brand, size, price range)

---

## 📊 Sample Output

```
1. daraz.pk     | Apple iPhone 14 (128GB) Midnight | Rs. 234,999 | https://daraz.pk/iphone14
2. galaxy.pk    | iPhone 14 PTA Approved | Rs. 229,999 | https://galaxy.pk/product/iphone14
3. shophive.com | Apple iPhone 14 256GB | Rs. 245,000 | https://shophive.com/apple-iphone14
```

---

## 📸 Image Search Example

*(To be added with sample images in future updates)*

---

## ✅ TODOs
- Serper integration
- Switch from SearxNG to Serper
- HuggingFace token injection via `.env`
- Streamlit UI with IDEALO-inspired layout
- React Frontend with product comparison
- Docker support
- Unit tests and CI

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT License © 2025>Your Name