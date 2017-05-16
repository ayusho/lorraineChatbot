var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
//var connector = new builder.ChatConnector({
//    appId: process.env.MICROSOFT_APP_ID,
//    appPassword: process.env.MICROSOFT_APP_PASSWORD
//});
var connector = new builder.ChatConnector({
    appId: 'c4d12a93-c875-47ca-9700-28e949ec657a',
    appPassword: 'spZVMeScmRcN7QdP3afw5wE'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
});
