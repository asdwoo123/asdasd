const opcua = require('node-opcua');
const async = require('async');
const os = require('os');
const SocketIO = require('socket.io');
const express = require('express');
const path = require('path');

const client = new opcua.OPCUAClient();
const endpointUrl = `opc.tcp://192.168.1.11:4840`;
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
   res.render('index');
});

let the_subscription, the_session, io;

async.series([
    // 서버와 연결
    function(callback) {
        client.connect(endpointUrl, (err) => {
            if (err) {
                console.log('cannot connect to endpoint:', endpointUrl);
            } else {
                console.log('connected !');
            }
            callback(err);
        });
    },
    // 세션 생성
    function(callback) {
        client.createSession(null, (err, session) => {
            if (!err) {
                the_session = session;
            }
            callback(err);
        });
    },
    function(callback) {
        the_subscription = new opcua.ClientSubscription(the_session, {
            requestedPublishingInterval: 500,
            requestedMaxKeepAliveCount: 2000,
            requestedLifetimeCount: 6000,
            maxNotificationsPerPublish: 1000,
            publishingEnabled: true,
            priority: 10
        });
        the_subscription.on('started', () => {
            console.log('subscription started');
        });

        const server = app.listen('3000', () => {
            console.log('웹 서버가 시작되었습니다.');
        });

        io = SocketIO(server, { path: '/socket.io' });
        io.on('connection', (socket) => {
        
        });
monitorWork('ns=3;s="BalluffSignalLightB7"', 'BalluffSignalLightB7');
 	monitorWork('ns=3;s="iLightCurtainOK_L"', 'iLightCurtainOK_L');
	monitorWork('ns=3;s="iDoorsClosed_L"', 'iDoorsClosed_L');
	monitorWork('ns=3;s="iAirPressureOK"', 'iAirPressureOK');
	monitorWork('ns=3;s="i24VPowerSupply"', 'i24VPowerSupply');

        
    },
    function(callback) {
        the_session.close((err) => {
            if (err) {
                console.log('session closed error');
            }
            callback();
        });
    }
], (err) => {
    if (err) {
        console.log('failure', err);
    } else {
        console.log('done!');
    }
    client.disconnect(() => {});
});


function monitorWork(nodeId, browseName) {
    const monitoredItem = the_subscription.monitor({
        nodeId: `${nodeId}`,
        attributeId: 13
    }, {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 100
    });
    monitoredItem.on('changed', (dataValue) => {
    //console.log('2진수: ', dataValue.value.value.toString(2));
    //console.log('16진수: ', dataValue.value.value.toString(16));
    //console.log(`${nodeId}의 값: `, dataValue.value.value);
let dataV = dataValue.value.value;
if (`${browseName}` === 'BalluffSignalLightB7') dataV = dataValue.value.value.toString(16);
//console.log(dataV);
        io.sockets.emit(`${browseName}`, {
            value: dataV,
            timestamp: dataValue.serverTimestamp,
            nodeId: `${nodeId}`
        });
    });
}
