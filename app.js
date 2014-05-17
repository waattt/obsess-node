var app = require('express.io')(), 
	express = require('express.io'),
    fs = require('fs'),
    firmata = require('/usr/local/lib/node_modules/firmata'),
    board = new firmata.Board('/dev/ttyACM0', arduinoReady);
 
function arduinoReady(err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Arduino connected. Firmware: ' + board.firmware.name 
      + '-' + board.firmware.version.major 
      + '.' + board.firmware.version.minor);
 
    var ledOn = true;
	for (var i = 0; i < ledPins; i++) {
		board.pinMode(ledPins[i], board.MODES.OUTPUT);
	}
}
 
app.http().io();
app.listen(8080);
console.log("Listening on http://192.168.2.9:8080...");

// a convenient variable to refer to the static directory
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
 // de arrays zijn globaal
var ledPins = [
	13,
	12,
	11
];
var ledPinsBezet = new Array();
app.io.sockets.on('connection', function(socket) {
    socket.send('connected...');
    socket.send('Bezig met ledPin toewijzen...');
	
	var ledPin;
	console.log('ledPins.length = ' + ledPins.length);
	if(ledPins.length > 0){
		var maakBezet = ledPins.shift();
		
		ledPin = maakBezet;
		socket.send('Toegewezen ledPin is ' + ledPin);
		
		ledPinsBezet.unshift(maakBezet);
		console.log('Maak bezet: '+ maakBezet);
		console.log('Led Pins Bezet: ' + ledPinsBezet);
				
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
	}else {
		socket.send('Sorry alle pins zijn bezet.');
		socket.emit('BOEM! Hij zit vol. Aantal gebruikers verbonden:' + ledPinsBezet.lenght);
	}
 
    socket.on('disconnect', function() {
        socket.send('disconnected...');
		console.log('ledPinsBezet.length = ' + ledPinsBezet.length);
		if(ledPinsBezet.length > 0){
			var maakVrij = ledPinsBezet.indexOf(ledPin);
			if(maakVrij != -1){
				maakVrij = ledPinsBezet.splice(maakVrij, 1);
				ledPins.unshift(maakVrij);
				console.log('Maakt Vrij: ' + maakVrij);
				console.log('Led Pins: ' + ledPins);
			}
		}
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
 