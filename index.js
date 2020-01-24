const CaptivePortal = require('./modules/CaptivePortal.js');
const net  = require("net");
const http = require('http');

setTimeout(CaptivePortal.start,1000);

const mySocket = (function(){
    const events = {};
    function on(event, callback) {events[event] = callback;}
    function eventTrigger(event, value) {if(events[event]) {events[event](value);}}
    this.eventTrigger = eventTrigger;
    this.on = on;
    return this;
})();

function initSocket() {
    var server = net.createServer(function(c) {
        c.write("Hello");
        try{
            setInterval(function(){
                c.write("PING");
            },900);
        }catch(e){}
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



var powerPos = 0.5;
var directionPos = 0.5;
function moveServos() {
    digitalPulse(D0,1,1+E.clip(powerPos,0,1));
    digitalPulse(D16,1,1+E.clip(directionPos,0,1));
}

function initEvents() {


    mySocket.on("power", (value)=>{
        var p =  ((-value)+1)/2;
        powerPos = (p - powerPos)/2;
    });
    mySocket.on("driveDirection", (value)=>{
        var p = (value+1)/2;
        directionPos += (p - directionPos)/2
    });

}

const startServer = () => {
    http.createServer(function (req, res) {
        res.writeHead(200);
        res.end("Hello World");
    }).listen(80);
    console.log('http server started');
};

function App() {
    startServer();
    initEvents();
    initSocket();

    digitalWrite(D0, 1);
    digitalWrite(D2, 1);
    digitalWrite(D5, 0);
    digitalWrite(D4, 0);
    digitalWrite(D14, 0);
    digitalWrite(D12, 0);

    setInterval("moveServos()", 50);

}

E.on('init', App);
App();
