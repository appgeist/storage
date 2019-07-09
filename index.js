/* eslint-disable no-console */
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');

const upload = require('./upload');
const serve = require('./serve');
const errorHandler = require('./errorHandler');

const PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Create a storage server Express-based instance
 *
 * @param {Object} options
 * @param {string} options.logPattern Log pattern provided to morgan,
 *    defaults to `:method :url :status - :response-time ms` in production and `dev` in development
 * @param {string} options.rootDir Folder to store files (relative to `cwd()`),
 *    defaults to `./files`
 * @param {string} options.tmpDir Temp folder used for uploading files,
 *    defaults to `require('os').tmpdir` in production and `./temp` relative to `cwd()` in development
 * @param {number} options.maxFileSize Maximum upload file size in bytes, defaults to `1024 * 1024 * 20` (20MB)
 * @param {number} options.maxPicturePixels Maximum upload file size in pixels,
 *    defaults to `1920 * 1080` (FullHD ~ 2 megapixels)
 * @param {number} options.maxUrlCacheEntries Maximum number of entries to keep in the file info cache,
 *    defaults to `10000000` (one million items)
 * @param {number|string} options.maxAge maxAge of served files,
 *    a number representing milliseconds or a string in [ms format](https://www.npmjs.com/package/ms);
 *    defaults to `365 days` in production and `0` in development;
 * @param {function(string): boolean|Promise<boolean>} options.validateToken An optional function to
 *    validate upload request; its token parameter comes from `Authentication: Bearer token` header
 *    present on the request (think [JWT](https://jwt.io/)/[RFC-6750](https://tools.ietf.org/html/rfc6750))
 * @returns {Object} Express instance
 */
module.exports = (options) => {
  const { logPattern, rootDir, tmpDir, maxFileSize, maxPicturePixels, maxUrlCacheEntries, maxAge, validateToken } = {
    logPattern: PRODUCTION ? ':method :url :status - :response-time ms' : 'dev',
    rootDir: './files',
    tmpDir: PRODUCTION ? require('os').tmpdir : './temp',
    maxFileSize: 1024 * 1024 * 20, // 20 megabytes
    maxPicturePixels: 1920 * 1080, // FullHD ~ 2 megapixels
    maxUrlCacheEntries: 10000000, // one million items
    maxAge: PRODUCTION ? '365 days' : 0, // one year for production, none for development
    ...options
  };

  const app = express();

  if (logPattern) app.use(morgan(logPattern));
  app.use(compression());
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(upload({ rootDir, tmpDir, maxFileSize, maxPicturePixels, validateToken }));
  app.use(serve({ rootDir, maxUrlCacheEntries, maxAge }));
  app.use(errorHandler);

  return app;
};
