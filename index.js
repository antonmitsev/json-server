const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('data/db.json');
const middlewares = jsonServer.defaults();
const SHA2 = require("sha2");
const privateShared = 'BlyajedSidkffkllekr';
const defaultValidity = 20 * 60 * 1000;
const pass = 'uZxh8LSHlrooznk=';
const user = 'anton';
const tokens = [];


const generateTokenHash = (user, currTimestamp, validity) => {
  const data = user + ':' + (currTimestamp).toString() + ':' + validity;
  return {
    data,
    hash: SHA2.SHA512_t(88, privateShared + data).toString('base64'),
  };
}

const generateToken = (user = '', validity = defaultValidity, currTimestamp = 0) => {
  if (currTimestamp === 0) {
    currTimestamp = new Date().getTime();
  }

  const hashObj = generateTokenHash(user, currTimestamp, validity);
  const buff = new Buffer(hashObj.data + ':' + hashObj.hash);
  return buff.toString('base64');
}

const decodeToken = (token = '') => {
  const buff = new Buffer(token, 'base64');
  const decodedToken = buff.toString('ascii');
  return decodedToken;
}

const checkToken = (decodedToken = '') => {
  const tokenArr = decodedToken.split(':');
  const calcHashObj = generateTokenHash(tokenArr[0], tokenArr[1], tokenArr[2]);
  return calcHashObj.hash === tokenArr[3];
}

const isAuthorized = (req) => {
  const token = req.header.token;
  if (token) {
    if (Object.keys(tokens).indexOf(token)) {
      // TODO check if the token is not expired!!!
      return true;
    }

    const decodedToken = decodeToken(token);
    if (checkToken(decodedToken)) {
      tokens = {
        ...tokens,
        [token]: decodedToken.split(':')[1] + decodedToken.split(':')[2]
      }
      return true;
    }
  }
  return false;
}

// "YW50b246MTU1ODYxOTY2OTUzNToxMjAwMDAwOmJWVlk1KzUrcnliUXBROD0="

server.use(jsonServer.bodyParser);

server.post('/login', (req, res) => {
  if (req.body.user === user &&
    SHA2.SHA512_t(88, req.body.pass + privateShared).toString('base64') === pass
  ) {
    res.jsonp({
      token: generateToken(req.body.user, defaultValidity)
    });
  } else {
    res.sendStatus(404);
  }
})


server.use(middlewares);

server.use((req, res, next) => {
  if (isAuthorized(req)) { // add your authorization logic here
    next(); // continue to JSON Server router
  } else {
    res.sendStatus(401);
  }
})


server.use((req, res, next) => {
  // res.jsonp(req.body);
  if (req.method === 'POST') {
    req.body.createdAt = Date.now();
    // res.jsonp(req.body);
    // return;
  }

  if (req.method === 'PATCH') {
    req.body.modifiedAt = Date.now();
  }

  if (req.method === 'PUT') {
    res.sendStatus(401);
    return;
  }
  // Continue to JSON Server router
  next();
})

// Use default router
server.use(router);

server.listen(3000, () => {
  console.log('JSON Server is running');
});
