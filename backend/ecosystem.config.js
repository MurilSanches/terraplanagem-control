module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/main.js',
      cwd: '/var/www/app/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
