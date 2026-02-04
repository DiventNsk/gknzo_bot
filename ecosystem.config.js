module.exports = {
  apps: [{
    name: 'gknzo_server',
    script: './server.js',
    watch: true,
    ignore_watch: ['node_modules', '.git'],
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'gknzo_bot',
    script: './bot.js',
    watch: true,
    ignore_watch: ['node_modules', '.git'],
    env: {
      NODE_ENV: 'production'
    }
  }]
};