// Socket System
const net  = require("net");

const Socket = (function(){
    const events = {};
    function on(event, callback) {events[event] = callback;}
    function eventTrigger(event, value) {if(events[event]) {events[event](value);}}
    this.eventTrigger = eventTrigger;
    this.on = on;

    this.init = function(){

        var server = net.createServer(function(c) {
            c.write("Hello");
            try{
                setInterval(function(){
                    try {
                        c.write("PING");
                    } catch(e) {}
                },900);
            }catch(e){}
            c.on('data', function(raw) {
                try{
                    let command = JSON.parse(raw.toString());
                    if(command.event) { Socket.eventTrigger(command.event, command.value);}
                } catch(e){}
            });
            //c.end();
        });
        server.listen(8888);
    };
    return this;
})();

module.exports = Socket;
