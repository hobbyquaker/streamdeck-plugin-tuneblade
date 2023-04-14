/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action('rocks.raff.tuneblade.action');

const config = {
	pollInterval: 1000
};

let interval;
let headers;
let state = false;

$SD.onDidReceiveSettings('rocks.raff.tuneblade.action', ({context, payload}) => {
	config.host = payload.settings.host;
	config.port = payload.settings.port;
	config.password = payload.settings.password;
	config.receiver = payload.settings.receiver;

	headers = new Headers();

	if (config.password) {
		headers.set('Authorization', 'Basic ' + btoa('MYTUNEBLADE:' + config.password));
	}

	getSpeakers(context);


});

function setStatus(context) {
	$SD.setState(context, state ? 1 : 0);
}
async function getStatus(context) {
	try {
		const response = await fetch(`http://${config.host}:${config.port}/v2/${config.receiver}`, {
			method: 'GET',
			headers
		});
		const body = await response.text();
		state = body.split(' ')[0] !== '0';
		setStatus(context);
	} catch (error) {
		$SD.showAlert(context);
		console.log(error);
	}
}

async function getSpeakers(context) {
	const response = await fetch(`http://${config.host}:${config.port}/v2`, {
		method: 'GET',
		headers
	});
	const body = await response.text();
	const lines = body.split('\r\n');
	lines.pop();
	const speakers = lines.map(line => {
		const [id, , , name] = line.split(' ');
		return {id, selected: id === config.receiver, name};
	});
	$SD.sendToPropertyInspector(context, speakers);
}
async function toggleStatus(action, context) {
	clearInterval(interval);
	try {
		const command = state ? 'Disconnect' : 'Connect';
		const response = await fetch(`http://${config.host}:${config.port}/v2/${config.receiver}/Status/${command}`, {
			method: 'GET',
			headers
		});
		const body = await response.text();
		if (body === '0') {
			state = true;

		} else if (body === '100' || body === '200') {
			state = false;
			setStatus(context);
		} else {
			$SD.showAlert(context);
			console.log('response body', body);
		}
		setTimeout(() => setStatus(context), 200);
	} catch (error) {
		$SD.showAlert(context);
		console.log(error);
	}
	interval = 	setInterval(() => getStatus(context), config.pollInterval);
}

myAction.onKeyDown(({ action, context, device, event, payload }) => {
	toggleStatus(action, context);
});

myAction.onWillAppear(({action, context}) => {
	$SD.getSettings(context);
	getStatus(context);
	getSpeakers(context);
	interval = 	setInterval(() => getStatus(context), config.pollInterval);
});

myAction.onWillDisappear(() => {
	clearInterval(interval);
});

myAction.onSendToPlugin(({context, payload}) => {
	switch (payload.command) {
		case 'getSpeakers':
			getSpeakers(context);
			break;
		default:
	}
});
