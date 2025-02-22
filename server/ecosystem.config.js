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
