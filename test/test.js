const tor_axios = require('../index.js');
const axios = require('axios');

const tor = tor_axios.torSetup({
    ip: '127.0.0.1',
    port: 4444,
    controlPort: 5555,
    controlPassword: 'giraffe',
});

const url = "http://api.ipify.org";
const httpsUrl = "https://api.ipify.org";

describe('Tor Test', function(){

    let realip = '';
    let torip = '';


    it('httpAgent function check', async function() {
        //console.log(tor);
        await tor.httpAgent();
    }).timeout(100000);

    it('Check IP with http', async function() {
        let response = await axios.get(url);
        realip = response.data;
        console.log(realip);
        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(realip)){
            throw new Error('connection failure');
        }

    }).timeout(100000);

    it('Check Tor IP with http', async function() {
        let torResponse = await tor.get(url);
        torip = torResponse.data;
        console.log(torip);
        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(torip)){
            throw new Error('connection failure');
        }
        
    }).timeout(10000);

    it('Check Tor IP with https', async function() {
        let torResponse = await tor.get(httpsUrl);
        torip = torResponse.data;
        //console.log(torip);
        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(torip)){
            throw new Error('connection failure');
        }
        
    }).timeout(10000);

    it('Check Real IP and Tor IP', function() {
        if ( realip === torip ) {
            throw new Error('Tor IP and real IP are the same');
        }
    })

    it('Tor Session Get New Session', async function() {
        await tor.torNewSession();

    }).timeout(10000);

    it('Tor new session IP change confirmation', async function() {
        let after = await tor.get(url);

        if ( torip === after.data ) {
            throw new Error('IP not changed');
        }

        console.log(`before: ${torip}, after: ${after.data}`);

        torip = after.data;
    }).timeout(100000);
    
})