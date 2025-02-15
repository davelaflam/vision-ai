# VisionAI Client App - Vue 3 + TypeScript + Vite Frontend

## 📌 Overview
The **VisionAI App Frontend** is a **Vue 3** application that provides a user-friendly interface for capturing, training, and detecting objects. It interacts with the **backend AI system**, which uses **TensorFlow.js** and **Pinecone** for machine learning and similarity search.

This application enables:
- **Camera Integration**: Start/stop a live video feed to capture images.
- **Training Mode**: Label and train images by sending them to the backend.
- **Detection Mode**: Capture an image, extract features, and identify objects using the backend model.
- **Logging & Debugging**: Uses `LoggerService` to track app events and errors.

---

## 📂 Project Structure

```
vision-app-client/
├── src/
│   ├── components/
│   │   ├── Vision.vue              # Main Vision Component (Controller)
│   │   ├── CameraControls.vue      # Start/Stop Camera
│   │   ├── DetectionResults.vue    # Display Detection Output
│   │   ├── ImageCapture.vue        # Capture Image (Training & Detection)
│   │   ├── ModeSwitch.vue          # Toggle Detection/Training Mode
│   ├── store/                      # Pinia store for state management
│   ├── plugins/                    # Vuetify and global plugins
│   ├── main.ts                     # Vue app entry point
│   ├── router/index.ts             # Vue Router configuration
│   ├── App.vue                     # Root Vue Component
│   ├── styles/                     # SCSS / CSS styles
│   ├── utils/LoggerService.ts      # Logging utility
│   ├── env/                        # Environment Variables
├── public/
│   ├── index.html                  # Main HTML file
├── package.json                    # Dependencies & scripts
├── pnpm-lock.json                  # Dependencies & scripts
└── README.md                       # Documentation
```

---

## 🛠 Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-repo/vision-app-client.git
cd vision-app-client
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
Create a `.env` file in the root directory and configure the **backend API URL**:

```
VITE_API_HOST=http://localhost:8080
```

---

## 🚀 Running the Application
To start the **Vue 3 frontend**, run:

```bash
pnpm run dev
```

This will start a **Vite development server**.  
By default, the application runs on **[http://localhost:5173](http://localhost:5173)**.

---

### 🔥 Benefits of Enhanced Logging
- **Easier Debugging**: Trace **exactly where** failures occur.
- **More Context in Logs**: `DEBUG` logs help inspect values.
- **Error Warnings**: Identifies non-critical issues (`WARN`).
- **Improved Error Handling**: Logs exact API request failures.

Now, **if the app misbehaves, you'll know why!** 🚀

---

## 📬 Conclusion
With this guide, you should be able to:
- Start the **Vue 3 frontend** with **Vite**.
- Capture images and interact with the **backend AI system**.
- Train and detect objects efficiently.
- Debug and log application events.

🚀 **Happy Coding!** 🎉
