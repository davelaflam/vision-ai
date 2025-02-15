# VisionAI App - AI-Powered Image Recognition

## 📌 Overview
The **VisionAI App Backend** is a machine learning-powered image recognition system that uses **TensorFlow.js** for feature extraction and **Pinecone** as a vector database for similarity search. The application allows users to train the model with new images and later detect objects by querying against the trained dataset.

### 🚀 Features
- **Train Mode**: Capture an image, extract features, and store embeddings in Pinecone.
- **Detect Mode**: Capture an image, extract features, and search Pinecone for the most similar object.
- **MobileNet Model**: Uses either:
   - ✅ A pre-trained **MobileNet v2** model loaded dynamically from TensorFlow.js.
   - ✅ A **custom-trained MobileNet v2 model** stored locally.
- **Pinecone Integration**: Stores and retrieves high-dimensional embeddings for efficient similarity search.
- **Node.js & TensorFlow.js**: Eliminates the need for Python dependencies by using TensorFlow.js in a Node.js environment.

---

## 📂 Project Structure

```
vision-app/
├── server/                         # Backend (Node.js, TensorFlow.js, Pinecone)
│   ├── services/                   # Core backend services
│   │   ├── logger/                 # Logging service
│   │   │   ├── LoggerService.ts    # Main logging utility
│   │   │   ├── types/              # Logger type definitions
│   │   │   │   ├── DebugLevel.ts   # Debugging levels
│   │   │   │   ├── ILog.ts         # Logging interface
│   │   │   │   ├── index.ts        # Type exports
│   │   │   │   ├── ITrackable.ts   # Trackable entity interface
│   │   │   │   ├── log.ts          # Log structure definition
│   │   │   │   ├── LogType.ts      # Enum for log types
│   ├── src/                        # Main backend logic
│   │   ├── embeddings.ts           # Embedding management
│   │   ├── handlers.ts             # Request handlers
│   │   ├── index.mts               # Main entry point (ES module)
│   │   ├── pinecone.ts             # Pinecone database interactions
│   │   ├── routes.ts               # API routes
│   │   ├── utils.ts                # Helper functions
│   ├── .env                        # Environment variables
│   ├── .env.example                # Environment variables
│   ├── README.md                   # Backend documentation
│   ├── dist                        # Dependencies & scripts
│   ├── package.json                # Dependencies & scripts
│   ├── pnpm-lock.json              # Dependencies & scripts
│   ├── requirements.txt            # Dependencies & scripts
│   ├── tsconfig.build.json         # Dependencies & scripts
│   ├── tsconfig.json               # Dependencies & scripts
│   ├── vercel.json                 # Dependencies & scripts
│   └──
├── client/                         # Frontend (Vue 3, Vuetify, TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Vision.vue           # Main Vision Component (Controller)
│   │   │   ├── CameraControls.vue   # Start/Stop Camera
│   │   │   ├── DetectionResults.vue # Display Detection Output
│   │   │   ├── ImageCapture.vue     # Capture Image (Training & Detection)
│   │   │   ├── ModeSwitch.vue       # Toggle Detection/Training Mode
│   ├── README.md                    # Frontend documentation
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment variables
│   ├── package.json                 # Dependencies & scripts
│   ├── main.ts                      # Vue app entry point
│   ├── router/index.ts              # Vue Router configuration
│   ├── App.vue                      # Root Vue Component
│   ├── styles/                      # SCSS / CSS styles
│   ├── utils/LoggerService.ts       # Logging utility
├── public/
│   ├── index.html                   # Main HTML file
├── package.json                     # Dependencies & scripts
└── README.md                        # Root documentation (this file)
```

---

## 🛠 Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-repo/vision-ai.git
cd vision-ai
```

### 2️⃣ Install Dependencies (**Using `pnpm`**)
This project uses **`pnpm`** as the package manager instead of `npm`. If you don’t have `pnpm` installed, run:

```bash
npm install -g pnpm
```

Then install dependencies:

```bash
pnpm install
```

---

### 3️⃣ Configure Environment Variables
Create a `.env` file in both **server** and **client** directories.

#### **Server `.env`**
```
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=image-recognition
PINECONE_DIMENSIONS=768
USE_CUSTOM_MODEL=false   # Set to 'true' to use the custom model in /models/mobilenet/mobilenet_tfjs/
```

#### **Client `.env`**
```
VITE_API_HOST=http://localhost:3000
```

---

## 🚀 Running the Application

### Start the **Backend Server**
```bash
cd server
pnpm dev
```

### Start the **Frontend (Vue 3)**
```bash
cd client
pnpm dev
```

By default, the frontend runs on **[http://localhost:5173](http://localhost:5173)**  
The backend runs on **[http://localhost:3000](http://localhost:8080)**

---

## 🎯 Usage With ngrok
### **Step 1: Install**
```bash
brew install ngrok
```

### **Step 2: Login or Create an Account** 
- Sign up for a free ngrok account `https://dashboard.ngrok.com/signup`
- Login to your account `https://dashboard.ngrok.com/login`

### **Step 3: Get your Auth Token**
- In the ngrok Dashboard:
  - Getting Started
    - Your Authtoken

### **Step 3: Edit ngrok.yml file**
- `cd` into `~/Library/Application Support/ngrok`
- run `nano ngrok.yml`, (add your ngrok auth token) paste the following and save the file:
```bash
version: "3"
agent:
    authtoken: your-ngrok-auth-token
tunnels:
  frontend:
    addr: 5173
    proto: http
  backend:
    addr: 3000
    proto: http
```

### **Step 4: Start ngrok**
- `cd` into `vision-ai/server` and run the following command:
- run `ngrok start --all`
- Copy the URL for the backend tunnel
- Update the `VITE_API_HOST` variable in the client `.env` file

### **Step 5: Start the server and client**
#### Start the **Backend Server**
```bash
cd server
pnpm dev
```

#### Start the **Frontend (Vue 3)**
```bash
cd client
pnpm dev
```

### **Step 6: View in Mobile Device**
- copy the ngrok URL for the frontend tunnel
- open the URL in your mobile device browser

---

## 📖 Documentation
For detailed information, check out the **individual README files**:

- 📜 **Backend Docs** → [server/README.md](server/README.md)
- 📜 **Frontend Docs** → [client/README.md](client/README.md)

---

## 📬 Conclusion
With this guide, you should be able to:
- Start both the **server** and **client** applications.
- Capture images, train the AI, and detect objects.
- Debug issues using built-in logging.
- Use a pre-trained or custom MobileNet model.

🚀 **Happy Coding!** 🎉
