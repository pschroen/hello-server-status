/**
 * @author pschroen / https://ufo.ai/
 *
 * Remix of https://glitch.com/edit/#!/hello-express
 */

import express from 'express';

const app = express();

//

app.get('/server-status', (req, res) => {
	res.send('Hello World!');
});

//

const listener = app.listen(process.env.PORT, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});
