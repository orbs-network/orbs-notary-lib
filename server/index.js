/**
 * Copyright 2019 the orbs-notary authors
 * This file is part of the orbs-notary library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');
const storeRouteFactory = require('./routes/store');
const verifyRouteFactory = require('./routes/verify');
const OrbsClientService = require('./services/orbs');

const port = process.env.PORT || 5678;

const virtualChainId = 1100000;
const orbsNodeAddress = '18.197.127.2';

const orbsClientService = new OrbsClientService(
  orbsNodeAddress,
  virtualChainId
);

const app = express();

app.get('/ping', (req, res) => res.send('pong'));

app.use('/api', storeRouteFactory(orbsClientService));
app.use('/api', verifyRouteFactory(orbsClientService));

app.listen(port, () => console.log(`Started on port ${port}!`));
