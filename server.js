/**
 * @author pschroen / https://ufo.ai/
 *
 * Remix of https://glitch.com/edit/#!/hello-express
 */

import express from 'express';
import { promisify } from 'util';
import child_process from 'child_process';
const exec = promisify(child_process.exec);

let osRelease;
let serverUptime;
let serverLoad;

try {
	osRelease = (await exec('cat /etc/os-release')).stdout;
} catch (err) {
	console.warn(err.stderr);
}

const app = express();

//

app.get('/server-status', async (req, res) => {
	const currentTime = Date.now();

	try {
		serverUptime = (await exec('cat /proc/uptime')).stdout;
		serverUptime = Number(serverUptime.split(' ')[0]) * 1000; // milliseconds
	} catch (err) {
		console.warn(err.stderr);
	}

	try {
		serverLoad = (await exec('cat /proc/loadavg')).stdout;
		serverLoad = Number(serverLoad.split(' ')[0]);
	} catch (err) {
		console.warn(err.stderr);
	}

	res.json({
		serverVersion: `Node/${process.versions.node} (${osRelease})`,
		currentTime,
		restartTime: currentTime - serverUptime,
		serverUptime,
		serverLoad
	});
});

//

const listener = app.listen(process.env.PORT, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});
