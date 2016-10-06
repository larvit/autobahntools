[![Build Status](https://travis-ci.org/larvit/larvitamintercom.svg?branch=master)](https://travis-ci.org/larvit/larvitamintercom) [![Dependencies](https://david-dm.org/larvit/larvitamintercom.svg)](https://david-dm.org/larvit/larvitamintercom.svg)

# Larvitamintercom

Communication wrapper for rabbitmq in autobahn.

### Send:

By default send() will also publish the same message to an exchange with the same name as the send que. Options is declared under this example.

```javascript
const	Intercom	= require('larvitamintercom').Intercom,
	conStr	= 'amqp://user:password@192.168.0.1/',
	intercom	= new Intercom(conStr);

let	message	= {'hello': 'world'},
	options	= {'que': 'senderQue'};

intercom.send(message, options, function(err) {
	// When callback is invoked the message have been acked by a receiver
});
```

###### Default send options:

```javascript
{
	'que':	'',
	'exchange':	this.que,
	'durable':	false,
	'publish':	true
}
```

### Consume:

```javascript
const	Intercom	= require('larvitamintercom').Intercom,
	conStr	= 'amqp://user:password@192.168.0.1/',
	intercom	= new Intercom(conStr);

let options = {'que': 'sendQue'};

intercom.consume(options, function(message, rawMsg) {
	// message being the object sent with intercom.send()
	// rawMsg being an object with lots of stuff directly from RabbitMQ
	// message === JSON.parse(rawMsg.content.toString())
}, function(err, result) {
	// Callback from established consume connection
	// TODO: find out what result is
});

```

###### Default consume options:

```javascript
{
	'que': '',
	'ack': true
}
```

### Subscribe:

```javascript
const	Intercom	= require('larvitamintercom').Intercom,
	conStr	= 'amqp://user:password@192.168.0.1/',
	intercom	= new Intercom(conStr);

let options = {'exchange': 'subscribeExchange'};

intercom.subscribe(options, function(message, rawMsg) {
	// message being the object sent with intercom.send()
	// rawMsg being an object with lots of stuff directly from RabbitMQ
	// message === JSON.parse(rawMsg.content.toString())
}, function(err, result) {
	// Callback from established subscribe connection
	// TODO: find out what result is
});
```

###### Default subscribe options:

```javascript
{
	'exchange':	'',
	'durable':	false,
	'type':	'fanout',
	'ack':	true
}
```

### Publish:

The send() function will automatically publish the message as well. However, if you want to publish a message without sending it to at regular que you can do that as well.

```javascript
const	Intercom	= require('larvitamintercom').Intercom,
	conStr	 'amqp://user:password@192.168.0.1/',
	intercom	 new Intercom(conStr);

let	message	= {'hello': 'world'}, // This will be converted to a Buffer. Naturally this could also be a buffer to begin with.
	options	= {'exchange': 'publishExchange'};

intercom.publish(message, options, function(err) {
	// When callback is invoked the message have been received by all subscribers
});
```

###### Default publish options:

```javascript
{
	'exchange':	'',
	'type':	'fanout'
}
```
