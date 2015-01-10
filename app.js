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

//initialize express / socket.io / firmata(arduino firmware)
var app = require('express.io')(), 
	express = require('express.io'),
    fs = require('fs'),
    firmata = require('firmata'),
    board = new firmata.Board('/dev/ttyACM0', arduinoReady);

app.http().io();
app.listen(8080);
console.log("Listening on port 8080");

// Arduino Ready
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
	
	board.pinMode(topSensor, board.MODES.INPUT);
	board.pinMode(botSensor, board.MODES.INPUT);
	
		//test sensors
		//board.digitalRead(topSensor,function(value){console.log('Test topsensor: ' + value);});
		//board.digitalRead(botSensor,function(value){console.log('Test botsensor: ' + value);});
	
	board.pinMode(enablePin, board.MODES.PWM);
	board.pinMode(motorPin1, board.MODES.OUTPUT);
	board.pinMode(motorPin2, board.MODES.OUTPUT);
    
		//test motor - omlaag
		/*board.analogWrite(enablePin, 255);
		board.digitalWrite(motorPin1, board.LOW);
		board.digitalWrite(motorPin2, board.HIGH);*/
	
	//  MOTOR IZZL (op en neer)
	var motorMode = 3;
	
	var loopje;
	var loopje_count = 0;
	motorModes(motorMode);
	function motorModes(mode){
		
		if(loopje_count >= 1){
			clearInterval(loopje);
			loopje_count = 0;
		}
		
		//this part puts the motor in the right place - all the way down.
		setMotor(255, 1); 
		var timeout = setTimeout(function(){	
			setMotor(255, 0); 
			board.digitalRead(botSensor,function(value){
				if (value === 1) {
					setMotor(0, 1);
					animateMotor();
				}
			});
		}, 200);
		
		function animateMotor(){
			//here come the modes
			if(motorMode == 0){		
				var delay = 1000;
				var interval = 150 + delay;
				
				if(loopje_count == 0){
					var up = false;
					loopje = setInterval(function(){
						if(up == false){
							setMotor(0, 1);
							setTimeout(function(){	
								setMotor(200, 1);
							},delay);
						}
						if(up == true){
							setMotor(0, 1);
							setTimeout(function(){	
								setMotor(70, 0);
							},delay);
						}
						up = !up;
					}, interval);
					loopje_count++;
				}
			}
			if(motorMode == 1){
				var delay = 500;
				var interval = 350 + delay;
				
				if(loopje_count == 0){
					var up = false;
					loopje = setInterval(function(){
						if(up == false){
							setMotor(0, 1);
							setTimeout(function(){	
								setMotor(200, 1);
							},delay);
						}
						if(up == true){
							setMotor(0, 1);
							setTimeout(function(){	
								setMotor(20, 0);
							},delay);
						}
						up = !up;
					}, interval);
					loopje_count++;
				}
			}
			if(motorMode == 2){
				var delay = 500;
				var interval = 350 + delay;
				
				setMotor(200, 1);
				setTimeout(function(){
					setMotor(70, 0);
					board.digitalRead(botSensor,function(value){
						if(value == 1){
							setMotor(0, 0);
						}
					});
				},delay);
			}
			if(motorMode == 3){
				setMotor(200, 1);
				board.digitalRead(topSensor,function(value){
					if(value == 1){
						setMotor(70, 0);
					}
				});
				board.digitalRead(botSensor,function(value){
					if(value == 1){
						setMotor(255, 1);
					}
				});
			}
		}
	}
	
	/* making sure it goes the other way when reaching the end
	board.digitalRead(topSensor,function(value){
		if(value == 1){
			motorMode = 1;
			motorModes(motorMode);
		}
	});
	/*
	board.digitalRead(botSensor,function(value){
		if(value == 1){
			motorModes(motorMode);
		}
	});*/
	
	//not having to write this every time
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
}

// a convenient variable to refer to the static directory
var html_dir = './static/';

// routes to serve the static HTML files
app.use(express.static(__dirname + '/static'));
app.get('/', function(req, res) {
    res.sendfile(html_dir + 'index.html');
});
/* NOTE: Nog een status pagina maken, zodat je 'als admin' kan zien hoe het ervoor staat.
app.get('/status', function(req, res) {
    res.sendfile(html_dir + 'status.html');
});*/

// this handles socket.io comm from html files

var ledPinsBezet = new Array();
app.io.sockets.on('connection', function(socket) {
    socket.send('connected...');
    socket.send('Bezig met ledPin toewijzen...');
	
	var ledPin;
	if(ledPins.length > 0){
		var maakBezet = ledPins.shift();
		
		ledPin = maakBezet;
		socket.send('Toegewezen ledPin is ' + ledPin);
		
		ledPinsBezet.unshift(maakBezet);
				
		socket.on('message', function(data) {
			if (data == 'clicked') {
				board.digitalWrite(ledPin, board.HIGH);
				clearTimeout(flash); //cancel out the other delay if repeaditly pressed
				var delay=200;// ms
				var flash = setTimeout(function(){
					board.digitalWrite(ledPin, board.LOW);
				},delay); 
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
 
