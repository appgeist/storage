const express = require('express');

const upload = require('./lib/upload');
const serve = require('./lib/serve');
const errorHandler = require('./lib/errorHandler');

const PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Create a storage server instance
 * @param {Object} [options]
 * @param {string} [options.storageDir] Folder to store files (relative to `cwd()`),
 *    defaults to `./storage`
 * @param {string} [options.tmpDir] Temp folder used for uploading files,
 *    defaults to `require('os').tmpdir` in production and `./temp` relative to `cwd()` in development
 * @param {number} [options.maxUploadSize] Maximum upload file size in bytes, defaults to `1024 * 1024 * 20` (20MB)
 * @param {number} [options.pictureQuality] Picture quality (in percents) for stored files,
 *    defaults to `25` (25%)
 * @param {number} [options.maxPicturePixels] Maximum stored file size in pixels,
 *    defaults to `1920 * 1080` (FullHD ~ 2 megapixels)
 * @param {number} [options.maxUrlCacheItems] Maximum number of entries to keep in the file info cache,
 *    defaults to `10000000` (one million items)
 * @param {number|string} [options.maxAge] maxAge of served files,
 *    a number representing milliseconds or a string in [ms format](https://www.npmjs.com/package/ms);
 *    defaults to `365 days` in production and `0` in development;
 * @param {TokenValidationHandler} [options.uploadTokenValidationHandler] Function used to validate an upload POST
 *    request based on its Authentication header value
 * @param {TokenValidationHandler} [options.serveTokenValidationHandler] Function used to validate a GET
 *    request based on its Authentication header value
 * @returns {import('express')} Express instance
 */
module.exports = (options) => {
  const {
    storageDir,
    tmpDir,
    maxUploadSize,
    pictureQuality,
    maxPicturePixels,
    maxUrlCacheItems,
    maxAge,
    uploadTokenValidationHandler,
    serveTokenValidationHandler
  } = {
    storageDir: './storage',
    tmpDir: PRODUCTION ? require('os').tmpdir : './temp',
    maxUploadSize: 1024 * 1024 * 20, // 20 megabytes
    pictureQuality: 85, // 85%
    maxPicturePixels: 1920 * 1080, // FullHD ~ 2 megapixels
    maxUrlCacheEntries: 10000000, // one million items
    maxAge: PRODUCTION ? '365 days' : 0, // one year for production, none for development
    ...options
  };

  const app = express();

  app.use(express.json());
  app.use(
    upload({
      storageDir,
      tmpDir,
      maxUploadSize,
      pictureQuality,
      maxPicturePixels,
      uploadTokenValidationHandler
    })
  );
  app.use(
    serve({
      storageDir,
      maxUrlCacheItems,
      maxAge,
      serveTokenValidationHandler
    })
  );
  app.use(errorHandler);

  return app;
};

/**
 * @callback TokenValidationHandler
 * @param {string} token Token to validate, coming from `Authentication: Bearer <token>` header
 *    present on the request (see [JWT](https://jwt.io/)/[RFC-6750](https://tools.ietf.org/html/rfc6750))
 * @returns {boolean|Promise<boolean>}
 */
