const { Client, logger } = require('./lib/client')
const { DATABASE, VERSION } = require('./config')
const { stopInstance } = require('./lib/pm2')
const http = require('http')

const PORT = process.env.PORT || 8000

let bot
let ready = false
let server

const start = async () => {
  logger.info(`levanter ${VERSION}`)
  try {
    await DATABASE.authenticate({ retry: { max: 3 } })
  } catch (error) {
    const databaseUrl = process.env.DATABASE_URL
    logger.error({ msg: 'Unable to connect to the database', error: error.message, databaseUrl })
    return stopInstance()
  }

  try {
    bot = new Client()
    await bot.connect()
    ready = true
    logger.info('Bot connected; health is ready')
  } catch (error) {
    logger.error(error)
  }
}

// Minimal HTTP health server
server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    const status = ready ? 200 : 503
    res.writeHead(status, { 'Content-Type': 'text/plain' })
    return res.end(ready ? 'ok' : 'starting')
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('running')
})

server.listen(PORT, () => logger.info(`Health server listening on :${PORT}`))

const shutdown = async (signal) => {
  try {
    logger.info(`${signal} received: shutting down`)
    ready = false
    if (server) {
      await new Promise((resolve) => server.close(resolve))
      logger.info('HTTP server closed')
    }
    if (bot && typeof bot.disconnect === 'function') {
      try {
        await bot.disconnect()
        logger.info('Bot disconnected')
      } catch (e) {
        logger.warn({ msg: 'Bot disconnect failed', error: e?.message })
      }
    }
    if (DATABASE && typeof DATABASE.close === 'function') {
      try {
        await DATABASE.close()
        logger.info('Database connection closed')
      } catch (e) {
        logger.warn({ msg: 'DB close failed', error: e?.message })
      }
    }
  } catch (e) {
    logger.error({ msg: 'Error during shutdown', error: e?.message })
  } finally {
    stopInstance()
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start()
