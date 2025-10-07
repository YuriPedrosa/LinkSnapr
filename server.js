require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const Url = require('./models/Url');
const urlRoutes = require('./routes/urls');
const logger = require('./utils/logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const MAX_REQUESTS = 100;
const ONE_HOUR = 60 * 60;

const limiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: MAX_REQUESTS,
  message: 'Muitas requests, tente novamente mais tarde.'
});
app.use(limiter);

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'client', 'dist')));

mongoose.connect(process.env.MONGODB_URI)
.then(() => logger.info('MongoDB conectado'))
.catch(err => logger.error('Erro ao conectar MongoDB:', err));

app.use('/api', urlRoutes);

app.get('/:shortCode', async (req, res) => {
  try {
    const shortCode = req.params.shortCode;

    let cachedUrl = await redis.get(`url:${shortCode}`);
    if (cachedUrl) {
      cachedUrl = JSON.parse(cachedUrl);
      if (cachedUrl.expiresAt && new Date() > new Date(cachedUrl.expiresAt)) {
        await redis.del(`url:${shortCode}`);
        return res.status(410).json({ error: 'Link expirado' });
      }

      Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 } }).exec();
      return res.redirect(cachedUrl.originalUrl);
    }

    const url = await Url.findOne({ shortCode });

    if (url) {
      if (url.expiresAt && new Date() > url.expiresAt) {
        return res.status(410).json({ error: 'Link expirado' });
      }
      url.clicks++;
      await url.save();

      await redis.setex(`url:${shortCode}`, ONE_HOUR, JSON.stringify({
        originalUrl: url.originalUrl,
        expiresAt: url.expiresAt
      }));
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});


app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando em http://localhost:${PORT}`);
});
