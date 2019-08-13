const express = require('express');
const exec = require('@appgeist/exec');
const fileExists = require('@appgeist/file-exists');

const URL_PATTERN = /^(\/(?:.+\/)?)(.{36})(?:-w(\d{2,4}))?(?:-h(\d{2,4}))?(-lq)?(\.\w+)$/;
// Regexp:            [dir        ][uuid ][width         ][height        ][lq  ][ext  ]
// Examples:
//   [1] dir: '/', '/folder/', '/folder/subfolder/'
//   [2] uid: '91afd63d-9c8a-4f01-bee8-fa163fa2495a'
//   [3] width: '800' or undefined
//   [4] height: '600' or undefined
//   [5] lq: '-lq' or undefined
//   [6] ext: '.jpg'

const VALID_CONVERT_EXTENSIONS = ['.jpg', '.gif', '.png', '.webp'];

module.exports = ({ storageDir, maxUrlCacheItems, maxAge }) => {
  const knownFiles = [];

  const addToKnownFiles = (file) => {
    if (knownFiles.length === maxUrlCacheItems) knownFiles.shift();
    knownFiles.push(file);
  };

  const router = express.Router();

  router.get(
    '*',
    async (req, res, next) => {
      try {
        // make sure url is lowercase
        const url = (req.url = req.url.toLowerCase());
        const [, dir, uuid, width = '', height = '', lq, ext] = URL_PATTERN.exec(url);
        if (knownFiles.includes(url)) {
          next();
          return;
        }
        if (await fileExists(`${storageDir}${url}`)) {
          addToKnownFiles(url);
          next();
          return;
        }
        if (
          !VALID_CONVERT_EXTENSIONS.includes(ext) || // make sure convert is only called with valid target formats
          !(await fileExists(`${storageDir}${dir}${uuid}.webp`))
        ) {
          res.sendStatus(404);
          return;
        }

        await exec(`
          convert ${storageDir}${dir}${uuid}.webp
            ${lq ? '-quality 25%' : ''}
            -resize ${width}x${height}^ -gravity center -extent ${width}x${height}
            ${storageDir}${url}
        `);
        addToKnownFiles(url);
        next();
      } catch (err) {
        res.sendStatus(404);
      }
    },
    express.static(storageDir, { maxAge })
  );

  return router;
};
