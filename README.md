# GenTalk 💬

**GenTalk** is a full-stack modern AI chatbot application powered by Google's Gemini models with a React frontend and a Python Flask backend.

---

## ✨ Features

- **Google Gemini API**: Powered by `gemini-3.5-flash-lite`, `gemini-3.5-flash`, and modern Gemini models.
- **Smart Fallback Architecture**: Automatically handles high demand (`503`), rate limits (`429`), and deprecated models (`404`) seamlessly with zero disruption.
- **Modern React Frontend**: Clean, dark-themed responsive chat interface with sidebar history, new chat functionality, and auto-scrolling.
- **Multi-turn Conversation**: Maintains conversational context across prompts.
- **Dual-mode Backend**: Serves both a RESTful API (`/api/chat`, `/api/health`) and the bundled web UI on port 5000.
- **CLI Mode**: Run directly in your terminal with `python app.py --cli`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend development)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup Environment
Clone the repository and create your `.env` file:

```bash
git clone https://github.com/satyadev3s/Gentalk.git
cd Gentalk
```

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 3. Install Dependencies
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend/frontend
npm install
npm run build
cd ../..
```

### 4. Running the Application

#### Option A: Quick Start (Windows)
Double-click `start_all.bat` or run:
```powershell
.\start_all.ps1
```

#### Option B: Run Backend Server
```bash
python app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

#### Option C: Run Frontend in Dev Mode (Vite)
```bash
cd frontend/frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Option D: Terminal CLI Chatbot
```bash
python app.py --cli
```

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Axios, CSS3
- **Backend**: Python, Flask, Flask-CORS
- **AI / LLM**: Google GenAI SDK (`google-genai`), Gemini 3.5 Flash Lite

---

## 📄 License
MIT License
