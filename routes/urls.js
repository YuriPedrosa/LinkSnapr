const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const validUrl = require('valid-url');
const Redis = require('ioredis');
const Url = require('../models/Url');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

router.post('/shorten', async (req, res) => {
  const { originalUrl, customCode, expiresAt } = req.body;

  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  let shortCode = customCode || shortid.generate();

  if (customCode) {
    if (!/^[a-zA-Z0-9]+$/.test(customCode)) {
      return res.status(400).json({ error: 'Código customizado deve ser alfanumérico' });
    }
    const existing = await Url.findOne({ shortCode: customCode });
    if (existing) {
      return res.status(400).json({ error: 'Código customizado já existe' });
    }
  }

  let expiration = null;
  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      return res.status(400).json({ error: 'Data de expiração inválida ou no passado' });
    }
    expiration = expDate;
  }

  try {
    let url = await Url.findOne({ originalUrl });
    if (url && !customCode) {
      return res.json({
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        message: 'URL já encurtada!'
      });
    }

    url = new Url({
      originalUrl,
      shortCode,
      expiresAt: expiration
    });

    await url.save();

    await redis.setex(`url:${url.shortCode}`, 3600, JSON.stringify({
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt
    }));

    res.json({
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      message: 'URL encurtada com sucesso!'
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});


router.get('/analytics/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
