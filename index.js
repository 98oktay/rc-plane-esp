var Wifi = require('Wifi');

const mySocket = (function(){
    const events = {};
    function on(event, callback) {events[event] = callback;}
    function eventTrigger(event, value) {if(events[event]) {events[event](value);}}
    this.eventTrigger = eventTrigger;
    this.on = on;
    return this;
})();
var pingTimer = null;

function initSocket() {
    var server = require("net").createServer(function(c, err) {
        if (err) {
            console.log("Its all gone bad and here's why: "+err);
            return;
        }
        try{
            c.write("Hello");
            console.log("Client Connected.");
            if(pingTimer) clearInterval(pingTimer);
            pingTimer = setInterval(function(){
                c.write("PING");
            },900);
        }catch(e){
            if(e.indexOf("closed") !== -1) {
                if(pingTimer) clearInterval(pingTimer);
            }
        }
        c.on('data', function(raw) {
            try{
                let command = JSON.parse(raw.toString());
                if(command.event) { mySocket.eventTrigger(command.event, command.value);}
            } catch(e){}
        });
        //c.end();
    });
    server.listen(8888);
}



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
    mySocket.on("throttle", (value)=>{
        throttlePos = value;
        keepPWMsignals();
    });
    mySocket.on("aileron", (value)=>{
        aileronPos = value;
        keepPWMsignals();
    });
    mySocket.on("elevator", (value)=>{
        elevatorPos = value;
        keepPWMsignals();
    });
    mySocket.on("rudder", (value)=>{
        rudderPos = value;
        keepPWMsignals();
    });
}

function App() {
    Wifi.stopAP();
    Wifi.startAP("RC-Plane", {authMode:"open"});
    initSocket();
    initEvents();
    setInterval(keepPWMsignals, 500);
    console.log("started...");
}

E.on('init', App);
