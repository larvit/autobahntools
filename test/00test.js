'use strict';

const	Intercom	= require(__dirname + '/../index.js').Intercom,
	uuidLib	= require('uuid'), // Used to make unique exchange and queue names
	assert	= require('assert'),
	async	= require('async'),
	log	= require('winston'),
	fs	= require('fs');

let	confFile,
	intercom11,
	intercom12,
	intercom13,
	intercom21,
	intercom22,
	intercom23,
	intercom31,
	intercom32;

// Set up winston
log.remove(log.transports.Console);

before(function(done) {
	function instantiateIntercoms(config) {
		intercom11	= new Intercom(config);
		intercom12	= new Intercom(config);
		intercom13	= new Intercom(config);
		intercom21	= new Intercom(config);
		intercom22	= new Intercom(config);
		intercom23	= new Intercom(config);
		intercom31	= new Intercom(config);
		intercom32	= new Intercom(config);
		done();
	}

	if (process.env.CONFFILE === undefined) {
		confFile = __dirname + '/../config/amqp_test.json';
	} else {
		confFile = process.env.CONFFILE;
	}

	log.verbose('Autobahn config file: "' + confFile + '"');

	// First look for absolute path
	fs.stat(confFile, function(err) {
		if (err) {

			// Then look for this string in the config folder
			confFile = __dirname + '/../config/' + confFile;
			fs.stat(confFile, function(err) {
				if (err) throw err;
				log.verbose('Autobahn config: ' + JSON.stringify(require(confFile)));
				instantiateIntercoms(require(confFile).default);
			});

			return;
		}

		log.verbose('Autobahn config: ' + JSON.stringify(require(confFile)));
		instantiateIntercoms(require(confFile).default);
	});
});

describe('Send, Recieve, Publish and Subscribe', function() {

	it('Test Connection', function(done) {
		const	Intercom	= require(__dirname + '/../index.js').Intercom,
			intercom	= new Intercom(require(confFile).default);

		intercom.ready(done);
	});

	// We do this to ensure intercom is just called once per session.
	it('Test parallel connection', function(done) {
		const	Intercom	= require(__dirname + '/../index.js').Intercom,
			intercom	= new Intercom(require(confFile).default);

		intercom.ready(done);
	});

	it('Send & Consume without publishing', function(done) {
		const	queueName	= uuidLib.v4(),
			tasks	= [];

		// Handle incoming consumed message
		function handleCon(msg) {
			assert.deepEqual(msg.content.toString(), 'Hello World');

			// We wait 200ms to make sure no subscribed message is received in handleSub() before exiting
			setTimeout(function() {
				done();
			}, 200);
		}

		// Handle incoming subscribed message
		function handleSub(msg) {
			throw new Error('No message should be received on this channel, but received: ' + msg.content.toString());
		}

		// Subscribe to queue (this shoul fail!)
		tasks.push(function(cb) {
			// We subscribe on the exchange == queueName since this is the default if no exchange is given in the send
			intercom11.subscribe({'exchange': queueName}, handleSub, function(err, result) {
				if (err) throw err;

				assert.notDeepEqual(result.consumerTag, undefined);
				cb();
			});
		});

		// Consume from queue
		tasks.push(function(cb) {
			// Consume as opposed to subscribe.
			intercom12.consume({'que': queueName}, handleCon, function(err, result) {
				if (err) throw err;

				assert.notDeepEqual(result.consumerTag, undefined);
				cb();
			});
		});

		// Send to queue
		tasks.push(function(cb) {
			// Instantiate a new intercom connection and sends a message.
			const	message	= 'Hello World';

			intercom13.send({que: queueName, publish: false}, message, cb);
		});

		async.series(tasks, function(err) {
			if (err) throw err;
		});
	});

	it('Send & publish', function(done) {
		const	exchangeName	= uuidLib.v4(),
			queueName	= uuidLib.v4(),
			tasks	= [];

		// Subscribe on testExchange2, send and publish message.
		tasks.push(function(cb) {
			intercom21.subscribe({'exchange': exchangeName}, function(msg) {
				assert.deepEqual(msg.content.toString(), 'Hello World');
				cb();
			}, function(err, result) {
				if (err) throw err;

				assert(result.consumerTag !== undefined);

				const	message	= 'Hello World';
				intercom22.send({'que': queueName, 'exchange': exchangeName}, message);
			});
		});

		// Consume messages on testQue2.
		tasks.push(function(cb) {
			intercom23.consume({'que': queueName}, function(msg) {
				assert.deepEqual(msg.content.toString(), 'Hello World');
				cb();
			}, function(err, result) {
				if (err) throw err;
				assert(result.consumerTag !== undefined);
			});
		});

		async.series(tasks, function(err) {
			if (err) throw err;
			done();
		});
	});

	it('Subscribe & Publish', function(done) {
		const	exchangeName	= uuidLib.v4();

		intercom31.subscribe({'exchange': exchangeName}, function(msg) {
			assert.deepEqual(msg.content.toString(), 'Hello World');
			done();
		}, function(err, result) {
			if (err) throw err;

			assert(result.consumerTag !== undefined);
			intercom32.publish({'exchange': exchangeName}, 'Hello World');
		});
	});

});