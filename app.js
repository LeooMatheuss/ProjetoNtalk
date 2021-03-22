const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const consign = require('consign');
const bodyParser = require('body-parser');
const cookie = require('cookie');
const compression = require('compression')
const expressSession = require('express-session');
const methodOverride = require('method-override');
const config = require('./config');
const error = require('./middlewares/error');
const redisAdapter = require('socket.io-redis');
const RedisStore = require('connect-redis')(expressSession)

const app = express();
const server = http.Server(app);
const io = require('socket.io').listen(server);
const store = new RedisStore({ prefix: config.sessionKey });

app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(expressSession({
  store,
  resave: true,
  saveUninitialized: true,
  name: config.sessionKey,
  secret: config.sessionSecret
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(
  express.static(
    path.join(__dirname, 'public'),
    { maxAge: 3600000 }
  )
);


io.sockets.on('connection', function (client) {
  client.on('send-server', function (data) {
    console.log(data);
    var msg = "<b>" + data.nome + ":</b> " + data.msg + "<br>";
    client.emit('send-client', msg);
    client.broadcast.emit('send-client', msg);
  });
});

consign({ verbose: false })
  .include('models')
  .then('controllers')
  .then('routes')
  .then('events')
  .into(app, io)
  ;

app.use(error.notFound);
app.use(error.serverError);

server.listen(3000, () => console.log('Ntalk no ar.'));

module.exports = app;
