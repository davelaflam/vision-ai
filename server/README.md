

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
      instances: "max", // or a specific number like 1, 2, etc.
      exec_mode: "cluster", // use cluster mode to take advantage of multi-core systems
      env: {
        NODE_ENV: "production",
        PORT: 3000 // or any port you prefer
      },
      // Optional: automatically restart the app if it exceeds 500MB
      max_memory_restart: "500M",
      // Optional: disable file watching in production
      watch: false
    }
  ]
};
```

### 3️⃣ PM2 NPM Scripts

Your `package.json` includes PM2 scripts for managing the production process.
For example, ensure your `package.json` scripts section includes:

```json
{
  "scripts": {
    "start": "node -r tsconfig-paths/register build/index.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "logs:pm2": "pm2 logs vision-ai-server-app",
    "prod": "pnpm start:pm2 && pnpm logs:pm2",
    "prod:stop": "pm2 stop vision-ai-server-app",
    "prod:restart": "pm2 restart vision-ai-server-app"
  }
}
```

### 4️⃣ Start in Production Mode

After building the app, start production mode with:

```bash
pnpm prod
```

This command will start your server app using PM2 in cluster mode, ensuring optimal performance and scalability.

---

## 📬 Conclusion

With this guide, you should be able to:

- Build the server for production.
- Run and manage the production server app using PM2 with a cluster mode configuration.
- Debug and view logs via PM2.

🚀 **Happy Coding!** 🎉
