// Captive Portal
var http = require('http');

var Wifi = require('Wifi');
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var SSID = 'RC-PLANE';
var authMode = 'open';
var portDNS = 53;

var dnsIPStr = '192.168.4.1';
var dnsIP = dnsIPStr.split('.').map(n => String.fromCharCode(parseInt(n, 10))).join('');

var HTTP_HEAD = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/><meta  name='viewport' content='width=device-width, initial-scale=1, user-scalable=no' /><style>.c{text-align: center;}div, input {padding: 5px;        font-size: 1em;      }      input {        width: 95%;      }      body {        text-align: center;        font-family: verdana;      }      button {        border: 0;        border-radius: 0.3rem;        background-color: #1fa3ec;        color: #fff;        line-height: 2.4rem;        font-size: 1.2rem;        width: 100%;      }      .q {        float: right;        width: 64px;        text-align: right;      }      .l {        background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAALVBMVEX///8EBwfBwsLw8PAzNjaCg4NTVVUjJiZDRUUUFxdiZGSho6OSk5Pg4eFydHTCjaf3AAAAZElEQVQ4je2NSw7AIAhEBamKn97/uMXEGBvozkWb9C2Zx4xzWykBhFAeYp9gkLyZE0zIMno9n4g19hmdY39scwqVkOXaxph0ZCXQcqxSpgQpONa59wkRDOL93eAXvimwlbPbwwVAegLS1HGfZAAAAABJRU5ErkJggg==') no-repeat left center;        background-size: 1em;      }    </style>    <script>      function c(l) {        document.getElementById('s').value = l.innerText || l.textContent;        document.getElementById('p').focus();      }    </script>  </head>  <body>    <div style='text-align:left;display:inline-block;min-width:260px;'>";
var HTTP_ITEM = "<div><a href='#p' onclick='c(this)'>{v}</a>&nbsp;<span class='q {i}'>{r}%</span></div>";
var HTTP_FORM_START = "<form method='get' action='/s' accept-charset=\"UTF-8\"><input id='s' name='s' length=32 placeholder='SSID'><br/><input id='p' name='p' length=64 type='password' placeholder='password'><br/><input id='n' name='n' length=32 placeholder='Device name' value='{n}'><br/>";
var HTTP_FORM_PARAM = "<input id='{i}' name='{n}' maxlength={l} placeholder='{p}' value='{v}' {c}><br/>";
var HTTP_FORM_END = "<br/><button type='submit'>Save and connect</button></form>";
var HTTP_SCAN_LINK = "<br/><div class='c'><a href='/'>Scan for networks</a></div>";
var HTTP_SAVED = "<div>Credentials Saved!<br/>Trying to connect ESP to network...<br/>If it fails reconnect to AP to try again.</div>";
var HTTP_END = "</div></body></html>";


function getRSSIasQuality(RSSI) {
    var  quality;
    if (RSSI <= -100) { quality = 0; }
    else if (RSSI >= -50) { quality = 100; }
    else { quality = 2 * (RSSI + 100); }
    return quality;
}

var wifiScanning = false;
function wifiScan(context) {
    console.log('scan wifi...');
    if(wifiScanning) {
        console.log('scan wifi skipped: wifi already scanning.');
    }
    wifiScanning = true;
    Wifi.scan((res)=>{
        wifiScanning = false;
        //sort by rssi
        res = res.sort((a,b) => (b.rssi - a.rssi));
        // remove dubs
        res = res.filter((t, i, s) => i === s.findIndex((th) => (th.ssid === t.ssid)));
        var count=0;
        var scantxt='';
        res.forEach((e)=>{
            var quality = getRSSIasQuality(e.rssi);
            if (context.minimumQuality === -1 || context.minimumQuality < quality) {
                count++;
                scantxt += HTTP_ITEM
                    .replace("{v}", e.ssid)
                    .replace("{r}", quality)
                    .replace("{i}", e.authmode === 'open' ? '' : 'l');
            }
        });
        if (count===0) scantxt = "No networks found.";
        context.wifiitems="<br/>"+scantxt;
        console.log('wifi scan done. found '+count+' networks.');
        context.wifiscantimer=setTimeout(()=>{wifiScan(context)},context.wifiScanInterval);
    });
}

// get Query name out of message
// offset = 12
// end \x00
function dnsQname(msg) {
    var i = 12;
    var qname = '';
    while (msg[i] !== '\x00') {
        qname += msg[i];
        i++;
    }
    return qname + '\x00';
}

/*
1. line header
2. line query
3. line resource
*/
function dnsResponse(msg, dns_ip) {
    return msg[0] + msg[1] + '\x81\x80' + '\x00\x01' + '\x00\x01' + '\x00\x00\x00\x00' +
        dnsQname(msg) + '\x00\x01' + '\x00\x01' +
        '\xc0\x0c' + '\x00\x01' + '\x00\x01' + '\x00\x00\x00\xf9' + '\x00\x04' + dns_ip;
}

function startDNSServer(port) {
    server.on('error', (err) => {
        server.close();
    });
    server.on('message', (msg, info) => {
        // we only serve ip4
        if (msg[msg.length - 3] === '\x01') {
            server.send(dnsResponse(msg, dnsIP), info.port, info.address);
        }
    });
    server.bind(port);
}


function onPageRequest(req, res, context) {
    var a = url.parse(req.url, true);
    var page;

    if (a.pathname === '/' || a.pathname === '') {
        page = HTTP_HEAD;
        page += "<h1>" + context.title + "</h1>";
        page += "<h3>Setup Wifi</h3>";
        page += HTTP_FORM_START.replace('{n}',context.hostname);
        context.params.forEach((p)=>{
            var pitem;
            if (p.id) {
                pitem = HTTP_FORM_PARAM
                    .replace("{i}", p.id)
                    .replace("{n}", p.id)
                    .replace("{p}", p.placeholder || '')
                    .replace("{l}", p.valueLength || '')
                    .replace("{v}", p.value || '')
                    .replace("{c}", p.customHTML || '');
            } else {
                pitem = p.customHTML;
            }
            page += pitem;
        });
        page += context.wifiitems;
        page += HTTP_FORM_END;
        page += HTTP_SCAN_LINK;
        page += HTTP_END;
        res.writeHead(200,{'Content-Length':page.length,'Content-Type': 'text/html'});
        res.end(page);
        return;
    }
    if (a.pathname === '/s') {
        context.params.forEach((p)=>{
            p.value = a.query[p.id];
        });
        page = HTTP_HEAD;
        page += HTTP_SAVED;
        page += HTTP_END;
        res.writeHead(200,{'Content-Length':page.length,'Content-Type': 'text/html'});
        res.end(page);
        Wifi.setHostname(a.query.n||context.apName);

        if (Wifi.getIP().ip === "0.0.0.0") {
            console.log("disconnect wifi")
            disconnectStation();
        }

        console.log(a.query.s);
        Wifi.connect(a.query.s, {password:a.query.p},
            (err) => {
                if (err) {
                    console.log('error connecting to wifi: '+err);
                    return;
                }
                console.log('wifi connected');
                setTimeout(Wifi.save,200);
                Wifi.stopAP(()=>{
                    if (context.connectedcallback) context.connectedcallback(); else setTimeout(context.restart,1000);
                });
            });
        if (context.paramscallback) context.paramscallback(context.params);
        return;
    }
    if (a.pathname === '/r') {
        page = HTTP_HEAD;
        page += "Module will reset in a few seconds.";
        page += HTTP_END;
        res.writeHead(200,{'Content-Length':page.length,'Content-Type': 'text/html'});
        res.end(page);
        setTimeout(context.restart,200);
        return;
    }
    res.writeHead(302, {'Location': 'http://'+context.apName});
    res.end('');
    return true;
}


// start http server
function startHttpServer(context) {
    var server = http.createServer(function (req, res) {
        onPageRequest(req, res, context)
    });
    server.listen(context.httpPort);
}



// start beeing a access point
function startAccessPoint(ssid, authMode, pass) {
    var apConfig = {"authMode": authMode};
    if (pass) {
        apConfig.password = pass;
    }
    Wifi.startAP(ssid, apConfig);
}

// stop beeing connected to a access point
function disconnectStation() {
    Wifi.disconnect();
}



function start() {
    var context = {
        title: "ESP Home HUB",
        hostname : Wifi.getHostname(),
        httpPort: 80,
        minimumQuality : -1,
        wifiScanInterval: 30000,
        wifiitems:"",
        restart : E.reboot,
        params:[]
    };
    //disconnectStation();

    wifiScan(context);
    startDNSServer(portDNS);
    startAccessPoint(SSID, authMode, null);
    startHttpServer(context);
}

exports.start=start;
