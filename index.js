const CaptivePortal = require('./modules/CaptivePortal.js');
const Socket = require('./modules/socket.js');

setTimeout(CaptivePortal.start,1000);

var throttlePos = 0;

var aileronPos = 0.5;
var elevatorPos = 0.5;
var rudderPos = 0.5;

function keepPWMsignals() {
    digitalPulse(D12, 1, 1 + E.clip(throttlePos, 0, 1));
    digitalPulse(D14, 1, 1 + E.clip(aileronPos, 0, 1));
    digitalPulse(D15, 1, 1 + E.clip(elevatorPos, 0, 1));
    digitalPulse(D4 , 1, 1 + E.clip(rudderPos, 0, 1));
}

function initEvents() {
    Socket.on("throttle", (value)=>{
        throttlePos = (value+1)/2
    });
    Socket.on("aileron", (value)=>{
        aileronPos = (value+1)/2
    });
    Socket.on("elevator", (value)=>{
        elevatorPos = (value+1)/2
    });
    Socket.on("rudder", (value)=>{
        rudderPos = (value+1)/2
    });
}

function App() {
    Socket.init();
    initEvents();
    setInterval(keepPWMsignals, 50);
}

E.on('init', App);
