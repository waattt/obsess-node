var app = require('http').createServer(handler), 
    io = require('/usr/local/lib/node_modules/socket.io').listen(app), 
	express = require('express.io');
    fs = require('fs'),
    firmata = require('/usr/local/lib/node_modules/firmata'),
    board = new firmata.Board('/dev/ttyACM0', arduinoReady);

var ledPin = 13;
 
function arduinoReady(err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Firmware: ' + board.firmware.name 
      + '-' + board.firmware.version.major 
      + '.' + board.firmware.version.minor);
 
    var ledOn = true;
    board.pinMode(ledPin, board.MODES.OUTPUT);
}
 
app.listen(8080);
console.log("Listening on http://192.168.2.9:8080...");
 
// directs page requests to html files
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
}
 
// this handles socket.io comm from html files
 
io.sockets.on('connection', function(socket) {
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
 
io.sockets.on('connection', function(socket){
    // Socket has connected, increase socket count
    socketCount++;
    // Let all sockets know how many are connected
    io.sockets.emit('users connected', socketCount);
 
    socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--;
        io.sockets.emit('users connected', socketCount);
    });
});
 