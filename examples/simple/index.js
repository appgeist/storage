const express = require('express');
const storage = require('../..');

const [host, port] = ['0.0.0.0', 3000];

const app = express();

app.use('/assets', storage());

app.listen(port, host, (err) => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${host}:${port}...`);
});
