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

class Server {
  constructor({ virtualChainId, orbsNodeAddress, port }) {
    this.port = port;
    this.app = express();
    this.orbsClientService = new OrbsClientService(
      orbsNodeAddress,
      virtualChainId
    );

    this.app.get('/ping', (req, res) => res.send('pong'));
    this.app.use(express.static('client/public'));
    this.app.use('/api', storeRouteFactory(this.orbsClientService));
    this.app.use('/api', verifyRouteFactory(this.orbsClientService));
  }

  start() {
    this._server = this.app.listen(this.port, () =>
      console.log(`Started on port ${this.port}!`)
    );
  }

  stop() {
    this._server.stop();
  }
}

module.exports = Server;
