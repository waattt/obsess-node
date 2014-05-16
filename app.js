var app = require('express.io')(), 
	express = require('express.io'),
    fs = require('fs'),
    firmata = require('/usr/local/lib/node_modules/firmata'),
    board = new firmata.Board('/dev/ttyACM0', arduinoReady);

var ledPin = 13;
 
function arduinoReady(err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Arduino connected. Firmware: ' + board.firmware.name 
      + '-' + board.firmware.version.major 
      + '.' + board.firmware.version.minor);
 
    var ledOn = true;
    board.pinMode(ledPin, board.MODES.OUTPUT);
}
 
app.http().io();
app.listen(8080);
console.log("Listening on http://192.168.2.9:8080...");
 
/* directs page requests to html files
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
 
    res.writeHead(200);
    res.end(data);
  });
}*/
// a convenient variable to refer to the HTML directory
var html_dir = './static/';

// routes to serve the static HTML files
app.use(express.static(__dirname + '/static'));
app.get('/', function(req, res) {
    res.sendfile(html_dir + 'index.html');
});
/* Note: route names need not match the file name
app.get('/hello', function(req, res) {
    res.sendfile(html_dir + 'hello.html');
});*/
 
// this handles socket.io comm from html files
 
app.io.sockets.on('connection', function(socket) {
    socket.send('connected...');
 
    socket.on('message', function(data) {
        if (data == 'turn on') {
            console.log('+');
            board.digitalWrite(ledPin, board.HIGH);
            socket.broadcast.send("let there be light!");
        }
        if (data == 'turn off') {
            console.log('-');
            board.digitalWrite(ledPin, board.LOW);
            socket.broadcast.send("who turned out the light?");
        }
        return;
    });
 
    socket.on('disconnect', function() {
        socket.send('disconnected...');
    });
});
var socketCount = 0;
 
app.io.sockets.on('connection', function(socket){
    // Socket has connected, increase socket count
    socketCount++;
    // Let all sockets know how many are connected
    app.io.sockets.emit('users connected', socketCount);
 
    socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--;
        app.io.sockets.emit('users connected', socketCount);
    });
});
 