/**
 * @author pschroen / https://ufo.ai/
 *
 * Remix of https://glitch.com/edit/#!/hello-express
 */

import { promisify } from 'node:util';
import child_process from 'node:child_process';
const exec = promisify(child_process.exec);

let osRelease;
let processorName;
let numProcessingUnits;
let ipinfo;
let memTotal;
let memFree;
let swapTotal;
let swapFree;
let storageTotal;
let storageAvailable;
let serverUptime;
let normalizedLoadAverage;

try {
	osRelease = (await exec('cat /etc/issue')).stdout;
	osRelease = osRelease.split(' ')[0];
} catch (err) {
	console.warn(err.stderr);
}

try {
	processorName = (await exec('lscpu | sed -nr "/Model name/ s/.*:\\s*(.*)/\\1/p" | tr -d "\\n"')).stdout;
} catch (err) {
	console.warn(err.stderr);
}

try {
	numProcessingUnits = (await exec('nproc --all')).stdout;
	numProcessingUnits = Number(numProcessingUnits);
} catch (err) {
	console.warn(err.stderr);
}

try {
	ipinfo = (await exec('curl https://ipinfo.io/')).stdout;
	ipinfo = JSON.parse(ipinfo);
} catch (err) {
	console.warn(err.stderr);
}

async function getDetails() {
	try {
		let free = (await exec('free -b | tail -2 | tr -s " " | cut -d " " -f 2,4')).stdout;
		free = free.split('\n').map(stdout => stdout.split(' '));
		memTotal = Number(free[0][0]);
		memFree = Number(free[0][1]);
		swapTotal = Number(free[1][0]);
		swapFree = Number(free[1][1]);
	} catch (err) {
		console.warn(err.stderr);
	}

	try {
		let storage = (await exec('df -B1 . | tail -1 | tr -s " " | cut -d " " -f 2,4')).stdout;
		storage = storage.split(' ');
		storageTotal = Number(storage[0]);
		storageAvailable = Number(storage[1]);
	} catch (err) {
		console.warn(err.stderr);
	}

	const data = {
		packageVersion: process.env.npm_package_name && process.env.npm_package_version ? `${process.env.npm_package_name}/${process.env.npm_package_version}` : undefined,
		projectDomain: process.env.PROJECT_DOMAIN ? `${process.env.PROJECT_DOMAIN}.glitch.me` : undefined,
		networkName: `${ipinfo.hostname} (${ipinfo.ip})`,
		serverVersion: `Node/${process.versions.node}${osRelease ? ` (${osRelease})` : ''}`,
		memTotal: memTotal || undefined,
		memFree: memFree || undefined,
		swapTotal: swapTotal || undefined,
		swapFree: swapFree || undefined,
		storageTotal: storageTotal || undefined,
		storageAvailable: storageAvailable || undefined,
		processorName: processorName || undefined,
		numProcessingUnits: numProcessingUnits || undefined
	};

	return data;
}

let serverDetails = await getDetails();
console.log(serverDetails);

//

import express from 'express';

const app = express();
app.set('json spaces', 2); // pretty print

app.get('/server-status', async (req, res) => {
	const currentTime = Math.floor(Date.now() / 1000); // seconds

	try {
		serverUptime = (await exec('cat /proc/uptime')).stdout;
		serverUptime = Number(serverUptime.split(' ')[0]);
	} catch (err) {
		console.warn(err.stderr);
	}

	try {
		normalizedLoadAverage = (await exec('cat /proc/loadavg')).stdout;
		normalizedLoadAverage = Number(normalizedLoadAverage.split(' ')[0]) / numProcessingUnits; // 0 to 1 range
		normalizedLoadAverage = Math.round((normalizedLoadAverage + Number.EPSILON) * 100) / 100;
	} catch (err) {
		console.warn(err.stderr);
	}

	serverDetails = await getDetails();

	res.json({
		...serverDetails,
		currentTime,
		restartTime: currentTime - serverUptime || undefined,
		serverUptime: serverUptime || undefined,
		normalizedLoadAverage: normalizedLoadAverage || undefined
	});
});

//

const listener = app.listen(process.env.PORT, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});
