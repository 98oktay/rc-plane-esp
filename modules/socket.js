// Socket System
const events = {};
function on(event, callback) {events[event] = callback;}
function eventTrigger(event, value) {if(events[event]) {events[event](value);}}
var pingTimer = null;
function init(){
    var server = require("net").createServer(function(client, err) {
        if (err) {
            console.log("Its all gone bad and here's why: "+err);
            return;
        }
        try{
            if(pingTimer) clearInterval(pingTimer);
            pingTimer = setInterval(function(){
                try {
                    console.log("write");
                    client.write("PING");
                } catch(e) {
                    console.log("write error", e)
                }
            },500);
        }catch(e){}
        client.on('data', function(raw) {
            try{
                let command = JSON.parse(raw.toString());
                if(command.event) { eventTrigger(command.event, command.value);}
            } catch(e){}
        });
        //c.end();
    });
    server.listen(8888);
};

module.exports.on = on;
module.exports.eventTrigger = eventTrigger;
module.exports.init = init;
