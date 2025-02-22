
# VisionAI Server App - Image Recognition with Pinecone & TensorFlow.js

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

## 🛠 Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-repo/vision-app.git
cd vision-app
```

### 2️⃣ Install Dependencies (**Using `pnpm`**)
This project uses **`pnpm`** as the package manager instead of `npm`. If you don’t have `pnpm` installed, run:

```bash
npm install -g pnpm
```

Then install dependencies with:

```bash
pnpm install
```

---

### 3️⃣ Configure Environment Variables
Create a `.env` file in the **server** directory and add your Pinecone API key & index name:
```
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=image-recognition
PINECONE_DIMENSIONS=768
USE_CUSTOM_MODEL=false   # Set to 'true' to use the custom model in /models/mobilenet/mobilenet_tfjs/
```

#### 📌 Model Selection
- **Set `USE_CUSTOM_MODEL=true`** to use a locally stored MobileNet v2 model at:
  ```
  /server/models/mobilenet/mobilenet_tfjs/
  ```
- **Set `USE_CUSTOM_MODEL=false`** to load MobileNet v2 dynamically from TensorFlow.js.

---

## 📌 **Pinecone Setup**
### **Step 1: Create a Pinecone Index**
1. **Sign up for Pinecone**
- If you don’t already have an account, sign up at [https://www.pinecone.io/](https://www.pinecone.io/).

2. **Create an Index**
- Navigate to the **Pinecone Console** → **Indexes** and create a new index.
- Use the following settings:
  - **Index Name:** `image-recognition`
  - **Dimensions:** `768` (For MobileNet v2)
  - **Metric:** `cosine` (Best for similarity search)
  - **Cloud Provider:** AWS
  - **Region:** 🇺🇸Virginia (us-east-1)

3. **Create and/or Get Your API Key**
- Find your API Key in the **Pinecone Console** under **API Keys**.

---

## 📥 **Downloading & Preparing Custom MobileNet Model**
If you want to use a **custom-trained MobileNet model**, follow these steps:

### **Step 1: Install python3.11**
NOTE: TensorFlow.js (TFJS) Converter relies on TensorFlow 2.x, which has official support for Python 3.11.
```bash
brew install python@3.11
```

### **Step 2: Create a Python Virtual Environment**
- `cd` into the **server** directory.

- Run the following:
```bash
python3.11 -m venv .vision-ai --prompt vision-ai
source .vision-ai/bin/activate
```

### **Step 3: Install requirements**
```bash
pip3.11 install -r requirements.txt
```

### **Step 4: Download the Model**
Download **MobileNet V2** from **Kaggle**:
- [🔗 Kaggle Model - MobileNet V2](https://www.kaggle.com/models/google/mobilenet-v2/tensorFlow2/140-224-classification)
- Select **Variation: 140-224-classification**
- Click **Download**
- Extract the downloaded model
- Rename the directory to `mobilenet`
- Move the `mobilenet` directory into:
  ```
  /server/models/
  ```

### **Step 5: Use sudo to Get Write Access**
```bash
sudo chmod -R 777 ~/path-to-cloned-repo/vision-ai/server/src/models/
```

### **Step 6: Convert the Model for TensorFlow.js**
In terminal, `cd` to `/server/src/models`

Run the following command to convert it to **TensorFlow.js Layers format**:
```bash
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model ./mobilenet ./mobilenet/mobilenet_tfjs
```

### **Step 7: Set Environment Variable in .env file**
```
USE_CUSTOM_MODEL=true
```

---

## 🔥 Production Mode with PM2

For production, the server app is managed by PM2 using a cluster mode setup to take advantage of multi-core systems.
This ensures better performance and reliability in a production environment.

### 1️⃣ Build the Application

First, compile your server assets:

```bash
pnpm run build
```

### 2️⃣ Production PM2 Setup

Your repository includes the following file:

#### `ecosystem.config.js`

This file configures PM2 to run the server in cluster mode.

Example content for `ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: "vision-ai-server-app",
      script: "./build/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      max_memory_restart: "500M",
      watch: false
    }
  ]
};
```

### 3️⃣ PM2 NPM Scripts

Ensure your `package.json` scripts section includes:

```json
{
  "scripts": {
    "start": "node -r tsconfig-paths/register build/index.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "logs:pm2": "pm2 logs vision-ai-server-app",
    "prod": "pnpm start:pm2",
    "prod:logs": "pnpm start:pm2 && pnpm logs:pm2",
    "prod:stop": "pm2 stop vision-ai-server-app",
    "prod:restart": "pm2 restart vision-ai-server-app"
  }
}
```

### 4️⃣ Start in Production Mode

```bash
pnpm prod
```
This command will start your server app using PM2, launching the server on port 3000.

### 4️⃣ Start in Production Mode with Logs

```bash
pnpm prod:logs
```
This command will start your server app using PM2, launching the server on port 3000 and tail the logs.

---

## 📖 Documentation
- 📜 **TensorFlow.js MobileNet Docs** → [TensorFlow MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- 📜 **Pinecone Docs** → [Pinecone Official Documentation](https://docs.pinecone.io/)

---

## 📬 Conclusion
With this guide, you should be able to:
- ✅ **Set up Pinecone for vector storage.**
- ✅ **Train images & store embeddings.**
- ✅ **Query Pinecone to detect objects.**
- ✅ **Use a pre-trained or custom MobileNet model.**
- ✅ **Build and run the server in production with PM2.**

🚀 **Happy Coding!** 🎉
