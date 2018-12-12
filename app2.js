const opcua = require('node-opcua');
const async = require('async');
const os = require('os');
const SocketIO = require('socket.io');
const express = require('express');
const path = require('path');

const client = new opcua.OPCUAClient();
const endpointUrl = `opc.tcp://${os.hostname()}:4334/UA/MyLittleServer`;
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use((req, res) => {
   res.render('index');
});

let the_subscription, the_session;

const server = app.listen('3000', () => {
    console.log('웹 서버가 시작되었습니다.');
});

const io = SocketIO(server, { path: '/socket.io' });
let the_socket;
io.on('connection', (socket) => {
    process.on('aaa', (data) => {
        socket.emit('opc data', data);
    });
});

function monitorWork(nodeId) {
    const monitoredItem = the_subscription.monitor({
        nodeId: `${nodeId}`,
        attributeId: 13
    }, {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 100
    });
    monitoredItem.on('changed', (dataValue) => {
        process.emit('aaa', dataValue.value.value.toString());
    });
}

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
            requestedPublishingInterval: 2000,
            requestedMaxKeepAliveCount: 2000,
            requestedLifetimeCount: 6000,
            maxNotificationsPerPublish: 1000,
            publishingEnabled: true,
            priority: 10
        });
        the_subscription.on('started', () => {
            console.log('subscription started');
        }).on('keepalive', () => {
            console.log('keepalive');
        }).on('terminated', () => {
            console.log('TERMINATED ----------------------->')
        });
        monitorWork('ns=1;s=free_memory');
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
