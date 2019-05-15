const Server = require('./server');

const port = process.env.PORT || 5678;
const virtualChainId = 1100000;
const orbsNodeAddress = '18.197.127.2';

new Server({
  virtualChainId,
  orbsNodeAddress,
  port
}).start();
