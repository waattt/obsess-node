var app = require('express.io')(), 
	express = require('express.io'),
    fs = require('fs'),
    firmata = require('/usr/local/lib/node_modules/firmata'),
    board = new firmata.Board('/dev/ttyACM0', arduinoReady);
 
var ledPins = [
	6,
	5,
	4,
	3
];

//sensor pins
var topSensor = 8;
var botSensor = 7;

// motor pins
var enablePin = 11;
var motorPin1 = 10;
var motorPin2 = 9;

function arduinoReady(err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Arduino connected. Firmware: ' + board.firmware.name 
      + '-' + board.firmware.version.major 
      + '.' + board.firmware.version.minor);
 
	for (var i = 0; i < ledPins; i++) {
		board.pinMode(ledPins[i], board.MODES.OUTPUT);
	}
	
	board.pinMode(enablePin, board.MODES.OUTPUT);
	board.pinMode(motorPin1, board.MODES.OUTPUT);
	board.pinMode(motorPin2, board.MODES.OUTPUT);
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
/* //////////////////////////////////////////////////////
////////////////// BEGIN DIKKE SJIT /////////////////////
///////////////////////////////////////////////////////*/

//  MOTOR IZZL (op en neer)

board.digitalRead(topSensor,function(value){
	if (value === 1) {
		setMotor(255, 0);
	}
});
digitalRead(bottomSensor,function(value){
	if (value === 1) {
		setMotor(255, 1);
	}
});

function setMotor(speed, reverse){
	if(reverse == 0){
		board.analogWrite(enablePin, speed);
		board.digitalWrite(motorPin1, board.LOW);
		board.digitalWrite(motorPin2, board.HIGH);
	}
	if(reverse == 1){
		board.analogWrite(enablePin, speed);
		board.digitalWrite(motorPin1, board.HIGH);
		board.digitalWrite(motorPin2, board.LOW);
	}
}

// this handles socket.io comm from html files

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
				
		socket.on('message', function(data) {
			if (data == 'turn on') {
				board.digitalWrite(ledPin, board.HIGH);
			}
			if (data == 'turn off') {
				board.digitalWrite(ledPin, board.LOW);
			}
			return;
		});
	}else {
		socket.send('Sorry alle pins zijn bezet.');
		// dit gebeurd als alle pins bezet zijn.
	}
 
    socket.on('disconnect', function() {
        socket.send('disconnected...');
		if(ledPinsBezet.length > 0){
			var maakVrij = ledPinsBezet.indexOf(ledPin);
			if(maakVrij != -1){
				maakVrij = ledPinsBezet.splice(maakVrij, 1);
				ledPins.unshift(maakVrij);
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
 