# @appgeist/storage

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]

![AppGeist Storage](https://user-images.githubusercontent.com/581999/61737873-c8120c80-ad91-11e9-8442-d73f86dde003.png)

An opinionated Express-based storage server featuring assets uploading and on-demand image-resizing. Like a self-hosted [Cloudinary](https://cloudinary.com).

Uses [ImageMagick](https://imagemagick.org), [multer](https://www.npmjs.com/package/multer) and [UUID](https://www.npmjs.com/package/uuid).

**Requires ImageMagick with WebP support**. Most linux distributions provide it by default and `brew install imagemagick` is everything you need to run to install it on macOS.

## Why

Because:

- Sometimes you want your assets to be stored on your own server;
- Most browsers can display [WebP](https://developers.google.com/speed/webp/) images and you should definitely use the new format whenever possible instead of `jpg`, `png` or `gif`;
- You need your pictures in various sizes and/or formats for different screen resolutions, sizes and device capabilities, but you don't always know all the possible combinations _a priori_.

## Usage

Simple, with default options:

```js
const storage = require("@appgeist/storage");

storage().listen(3000, err => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log("Storage server running...");
});
```

As Express middleware, with custom config options:

```js
const express = require("express");
const storage = require("@appgeist/storage");

const app = express();
app.use(
  "/assets",
  storage({
    storageDir: "./files",
    tmpDir: "./temp-uploads",
    maxUploadSize: 1024 * 1024 * 50, // 50 megabytes
    pictureQuality: 90,
    maxPicturePixels: 3840 * 2160, // 4K
    // a method to validate the POST upload requests, based on their
    // `Authorization: Bearer <token>` header
    uploadTokenValidationHandler: async token => {
      // ...
      const isValid = await myValidationApiMethod({ token, operation: 'upload' });
      return isValid;
    }
    // method to validate the GET requests
    serveTokenValidationHandler: async token => {
      // ...
      const isValid = await myValidationApiMethod({ token, operation: 'serve' });
      return isValid;
    }
  })
);

app.listen(3000, err => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log("Server running...");
});
```

See [@appgeist/example-storage-simple](https://github.com/appgeist/example-storage-simple) and [@appgeist/example-storage-with-auth](https://github.com/appgeist/example-storage-with-auth) for more.

## Default config options

Have a look at [index.js](index.js) to see the default config options; JSDoc comments are provided for IDE support.

## Uploading files

### Request payload

Files can be uploaded by `POST`ing to the mountpoint or a subfolder (i.e. `POST /assets` or `POST /assets/a/subfolder/to/store/the/uploaded/files`) with the following body payload:

```js
{
  file: fileData;
}
```

...where file represents the file `multipart/form-data` (provided, for instance by an `<input type="file" />` tag, see [multer](https://www.npmjs.com/package/multer) docs for more info).

Instead of simply uploading a file, the server can be instructed to dowload it from an accesible remote location by `POST`ing a URL instead of file data:

```js
{
  url: "http://example.com/catz.jpg";
}
```

The uploaded file will end up in `${storageDir}/assets` or a subfolder, such as `${storageDir}/assets/a/subfolder/to/store/the/uploaded/files`.

A [UUID](https://www.npmjs.com/package/uuid)/v4-based name will be generated for the uploaded file.

If the uploaded file is an image (`jpg`/`webp`/`png`/`gif`), it will be converted to webp using [ImageMagick](https://imagemagick.org) library and resized to `maxPicturePixels`, otherwise it will simply be stored in the original format.

Examples:

- uploading `catz.jpg` to `/assets` will generate a file like `/assets/9752d427-e6e2-4868-8abf-720db82421c2.webp`;
- uploading `doc.pdf` to `/assets/docs` will generate a file like `/assets/docs/9752d427-e6e2-4868-8abf-720db82421c2.pdf`;

### Token-based authorization

Bearer token based authorization can be enabled by providing `uploadTokenValidationHandler` and/or `serveTokenValidationHandler` functions in the storage options. A handler method will receive the request bearer token (specified as `Authentication: Bearer <token>` header) as its only parameter and must return a boolean or a Promise resolving to a boolean value.

### Server response

When succesfully uploading `catz.jpg` to `/assets/pics/animals`, the server will respond with the following JSON:

```json
{
  "path": "/pics/animals",
  "uuid": "9752d427-e6e2-4868-8abf-720db82421c2",
  "isPicture": true,
  "originalName": "catz.jpg",
  "aspectRatio": 1.77778
}
```

...where:

- **path** is where the the image was uploaded;
- **uuid** is a [RFC-4122](https://www.ietf.org/rfc/rfc4122.txt) unique identifier generated by [UUID](https://www.npmjs.com/package/uuid)/v4;
- **isPicture** is `true` (and `false` for non-picture uploads);
- **originalName** is the original file name (or URL);
- **aspectRatio** is the picture aspect ratio (determined by [ImageMagick](https://imagemagick.org) `identify` utility; this property is only present for picture file uploads).

## Serving files

Stored picture files can be served in multiple formats, resized/centered/cropped to a specified size.

Assuming a `9752d427-e6e2-4868-8abf-720db82421c2` uuid was issued by a previous picture upload, new files will be generated and served to `GET` requests like so:

- `/9752d427-e6e2-4868-8abf-720db82421c2.webp`
  will serve the original picture;
- `/9752d427-e6e2-4868-8abf-720db82421c2-w800-h600.webp`
  will serve the picture resized/centered/cropped to a **width** of 800px and a **height** of 600px;
- `/9752d427-e6e2-4868-8abf-720db82421c2-w50-h50-lq.webp`
  will serve a **low-quality** picture resized/centered/cropped to 50x50 pixels (useful for LQIPs).

Cropping and resizing only work for pictures. Other types of assets will only be served in the original format.

## Caution

Files generated for different sizes and formats **are never deleted**. **This can quickly eat up your server space.** Make sure to implement your own mechanism to delete old/unnecessary files!!!

## License

The [ISC License](LICENSE).

[npm-image]: https://img.shields.io/npm/v/@appgeist/storage.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@appgeist/storage
[license-image]: https://img.shields.io/npm/l/@appgeist/storage.svg?style=flat-square
[license-url]: LICENSE
