const axios = require("axios");
const net = require("net");
const os = require("os");
const SocksProxyAgent = require("socks-proxy-agent");

const NEWNYM_WAIT = 10000;

let defaultTorConfig = {
	ip: "127.0.0.1",
	port: "9050",
	path: "",
	controlPort: "9051",
	controlPassword: "giraffe",
};
let torConfig = {};

let lastNewnymTimestamp = Date.now();

const httpAgent = function () {
	return new SocksProxyAgent(
		`socks5h://${torConfig.ip || defaultTorConfig.ip}:${
			torConfig.port || defaultTorConfig.port
		}`
	);
};

const httpsAgent = function () {
	return new SocksProxyAgent(
		`socks5h://${torConfig.ip || defaultTorConfig.ip}:${
			torConfig.port || defaultTorConfig.port
		}`
	);
};

function torSetup(torConfigInbound) {
	torConfig.ip =
		torConfigInbound.ip === "localhost"
			? "127.0.0.1"
			: torConfigInbound.ip || defaultTorConfig.ip;
	torConfig.port = torConfigInbound.port || defaultTorConfig.port;
	torConfig.controlPort =
		torConfigInbound.controlPort || defaultTorConfig.controlPort;
	torConfig.controlPassword =
		torConfigInbound.controlPassword || defaultTorConfig.controlPassword;

	return {
		torNewSession,
		...axios.create({
			httpAgent: httpAgent(),
			httpsAgent: httpsAgent(),
		}),
		httpAgent,
		httpsAgent,
	};
}

function torIPC(commands) {
	return new Promise(function (resolve, reject) {
		let socket = net.connect(
			{
				host: torConfig.ip,
				port: torConfig.controlPort,
			},
			function () {
				let commandString = commands.join("\n") + "\n";
				socket.write(commandString);
				//resolve(commandString);
			}
		);

		socket.on("error", function (err) {
			reject(err);
		});

		let data = "";
		socket.on("data", function (chunk) {
			data += chunk.toString();
		});

		socket.on("end", function () {
			resolve(data);
		});
	});
}

function torNewSession() {
	let commands = [
		'authenticate "' + torConfig.controlPassword + '"', // authenticate the connection
		"signal newnym", // send the signal (renew Tor session)
		"quit", // close the connection
	];

	return new Promise(function (resolve, reject) {
		// check timestamp and setTimeout
		let wait = Math.max(0, lastNewnymTimestamp + NEWNYM_WAIT - Date.now());
		setTimeout(() => {
			torIPC(commands)
				.then(function (data) {
					// XXX remember timestamp
					lastNewnymTimestamp = Date.now();

					let lines = data.split(os.EOL).slice(0, -1);
					let success = lines.every(function (val, ind, arr) {
						// each response from the ControlPort should start with 250 (OK STATUS)
						return val.length <= 0 || val.indexOf("250") >= 0;
					});

					if (!success) {
						let err = new Error(
							"Error communicating with Tor ControlPort\n" + data
						);
						reject(err);
					}

					resolve("Tor session successfully renewed!!");
					//resolve(data);
				})
				.catch(function (err) {
					reject(err);
				});
		}, wait);
		console.log(`waiting ${wait}ms...`); // XXX
	});
}

module.exports = {
	httpAgent,
	torSetup,
	torNewSession,
	torConfig,
	httpsAgent,
};
