module.exports = {
  apps: [
    {
      name: 'vision-ai-client-app',
      script: './start-client.cjs',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
    },
  ],
}
