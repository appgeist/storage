const express = require('express');
const exec = require('@appgeist/exec');
const fileExists = require('@appgeist/file-exists');

const URL_PATTERN = /^(\/(?:.+\/)?)(.{36})(-(\d{2,4})x(\d{1,4})(-fit)?(-lq)?)?(\.\w+)$/;
const VALID_CONVERT_EXTENSIONS = ['.jpg', '.gif', '.png', '.webp'];

module.exports = ({ rootDir, maxUrlCacheEntries, maxAge }) => {
  const urlCache = [];

  const addToCache = (file) => {
    if (urlCache.length === maxUrlCacheEntries) urlCache.shift();
    urlCache.push(file);
  };

  const router = express.Router();

  router.get(
    '*',
    async (req, res, next) => {
      try {
        const [, dir, uuid, resize, width, height, fit = '', lq = '', ext] = URL_PATTERN.exec(req.url.toLowerCase());
        const url = (req.url = `${dir}${uuid}${resize ? `-${width}x${height}${fit}${lq}` : ''}${ext}`);
        if (urlCache.includes(url)) {
          next();
          return;
        }
        if (await fileExists(`${rootDir}${url}`)) {
          addToCache(url);
          next();
          return;
        }
        if (
          !(await fileExists(`${rootDir}${dir}${uuid}.webp`)) ||
          !VALID_CONVERT_EXTENSIONS.includes(ext) // make sure files convert is only called with valid formats
        ) {
          res.sendStatus(404);
          return;
        }

        // prettier-ignore
        await exec(`
          convert ${rootDir}${dir}${uuid}.webp
            ${resize ? `
              ${lq ? '-quality 25%' : ''}
              -resize ${width}x${height}${fit ? '' : `^ -gravity center -extent ${width}x${height}`}
            ` : ''}
            ${rootDir}${url}
        `);
        addToCache(url);
        next();
      } catch (err) {
        res.sendStatus(404);
      }
    },
    express.static(rootDir, { maxAge })
  );

  return router;
};
