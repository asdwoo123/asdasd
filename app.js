const opcua = require('node-opcua');
const async = require('async');


const client = new opcua.OPCUAClient();
const endpointUrl = 'opc.tcp://192.168.1.11:4840';

let the_subscription, the_session;


async.series([
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
    function(callback) {
        client.createSession(null, (err, session) => {
            if (!err) {
            the_session = session;
        }
        callback(err);
    });
    },
    function(callback) {
        const browsePath = [
            opcua.makeBrowsePath("RootFolder", "/Objects/Server.ServerStatus.BuildInfo.ProductName"),
        ];

        let productNameNodeId;
        the_session.translateBrowsePath(browsePath, function (err, results) {
            if (!err) {
                console.log(results[0].value.toString());
                productNameNodeId = results[0].targets[0].targetId;
            }
        });


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

