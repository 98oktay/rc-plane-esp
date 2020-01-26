/**
 * Esp PIN Test Monitoring
 *
 */

var asciichart = require ('asciichart');
var series = new Array (120);

for (var i = 0; i < series.length; i++)series[i] = 0;
series[119] = 20;

E = {
    on: (name, callback)=>{ callback(name) },
    clip: (a,min,max)=>Math.min(max,Math.max(a,min))
};

D0 = Symbol("D0");
D1 = Symbol("D1");
D2 = Symbol("D2");
D3 = Symbol("D3");
D4 = Symbol("D4");
D5 = Symbol("D5");
D6 = Symbol("D6");
D7 = Symbol("D7");
D8 = Symbol("D8");
D9 = Symbol("D9");
D10 = Symbol("D10");
D11 = Symbol("D11");
D12 = Symbol("D12");
D13 = Symbol("D13");
D14 = Symbol("D14");
D15 = Symbol("D15");
D16 = Symbol("D16");
D17 = Symbol("D17");
D18 = Symbol("D18");
D19 = Symbol("D19");

var pins = [D0, D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19];

digitalWrite = (pin, value)=>{
    var index = pins.indexOf(pin);
    series[index*4] = value * 20
};


digitalPulse = (pin, value, pow) => {
    var index = pins.indexOf(pin);
    series[index*4] = pow * 10
};

Wifi = {
    scan: ()=>{},
    startAP: ()=>{},
    getHostname: ()=>"local-host-name"
};


require("../index.js");

setInterval(()=>{
    console.clear();
    console.log(asciichart.plot(series, {
        offset:  3,          // axis offset from the left (min 2)
        padding: '       ',  // padding string for label formatting (can be overrided)
        height:  20,
    }));

},100);
