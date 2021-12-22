const path = require('path');
const PROTO_PATH = path.resolve(__dirname, './proto/contrato.proto');

const GRPCClient = require('node-grpc-client');

const myClient = new GRPCClient(PROTO_PATH, 'proto', 'Propriedade', 'localhost:9890');

const dataToSend = {};

// options is optional and is supported from version 1.5.0
// const options = {
//     metadata: {
//         hello: 'world'
//     }
// };


console.time("Grpc 1 ")
myClient.runService('Property', dataToSend, (err, res) => {
    if (err) {
        console.log(err);
    } else {
        console.log(res);
        console.timeLog("Grpc 1 ");
    }
});
