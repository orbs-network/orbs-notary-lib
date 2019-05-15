/**
 * Copyright 2019 the orbs-notary authors
 * This file is part of the orbs-notary library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

module.exports = orbsClientService => {
  const router = express.Router();

  router.post('/verify', async (req, res) => {
    res.sendStatus(200);
  });

  return router;
};
