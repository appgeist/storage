const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const delay = require('delay');
const storage = require('../..');

const [host, port] = ['0.0.0.0', 3000];

const app = express();

app.use(
  '/assets',
  storage({
    validateToken: async (token) => {
      await delay(2000); // wait to simulate an authentication API call
      return token === '--DUMMY-TOKEN--';
    }
  })
);

app.listen(port, host, (err) => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${host}:${port}...`);
});
