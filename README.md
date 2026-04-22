# ChecknGo 🍎🥦

ChecknGo is a modern, full-stack application designed for automated fruit and vegetable classification and weight detection. It combines a React-based frontend with a powerful Node.js backend, leveraging machine learning and computer vision to streamline inventory or point-of-sale processes.

## 🚀 Features

- **Automated Classification**: Identifies various fruits and vegetables using a TensorFlow Lite model.
- **OCR Weight Detection**: Extract weight information from labels or scales using Google Cloud Vision API.
- **Modern Dashboard**: A clean, responsive UI built with React, Vite, and Shadcn UI.
- **Secure Authentication**: Robust user authentication system using JWT and bcrypt.
- **Real-time Data**: Visualizes inventory and classification data with Recharts.
- **File Management**: Seamless image uploads via Multer.
- **Cloud Integration**: Integration with Google Cloud Vision for advanced image analysis.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Shadcn UI
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JSON Web Tokens (JWT) & bcrypt
- **AI/ML Integration**: `python-shell` for running TensorFlow Lite models
- **Image Processing**: Google Cloud Vision API
- **File Uploads**: Multer

### AI Engine
- **Model**: TensorFlow Lite (`fruit_model.tflite`)
- **Scripts**: Python based (`predict.py`, `weight_ocr.py`)

## 📦 Project Structure

```
ChecknGo/
├── backend/            # Express.js server & AI integration
│   ├── ai_model/       # TFLite model and Python scripts
│   ├── src/            # Backend source code
│   └── uploads/        # Processed image storage
├── frontend/           # Vite + React application
│   ├── src/            # UI components and logic
│   └── public/         # Static assets
└── temp_drawio/        # Design diagrams
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Python 3.x (with `tensorflow` and `opencv`)
- Google Cloud Vision API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dileeka11/ChecknGo.git
   cd ChecknGo
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Create a .env file with MONGODB_URI, JWT_SECRET, and GOOGLE_APPLICATION_CREDENTIALS
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 📝 License

This project is licensed under the ISC License.

---
Built with ❤️ by [Dileeka11](https://github.com/Dileeka11)
