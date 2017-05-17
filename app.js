var restify = require('restify');
var builder = require('botbuilder');
var Store = require('./store');
var spellService = require('./spell-service');

//=========================================================
// Dummy Data
//=========================================================

var customers = [
    {
        customer_id: 1,
        name: 'Alison Dixon',
        email: 'adixon@aol.com',
        phone: '7123456874'
    },
    {
        customer_id: 2,
        name: 'Maureen Campbell',
        email: 'mcampbell@hotmail.com',
        phone: '7890473120'
    }
];


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'c4d12a93-c875-47ca-9700-28e949ec657a',
    appPassword: 'spZVMeScmRcN7QdP3afw5wE'
});

server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});
// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/077f3176-c67a-43c4-b375-86480d2a903f?subscription-key=be9a51573555418a8f1195f0e32b5f16&timezoneOffset=0&verbose=true');
bot.recognizer(recognizer);

//=========================================================
// Bots Dialogs
//=========================================================
var selectedItem;
// Add first run dialog
bot.dialog('returnItem', [
    function (session, args, next) {


        // try extracting entities
        var dateEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'date');
        var itemsEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'items');
        session.send('Hi Alison, of course. We are processing your request. Please wait for a moment...');
        if (itemsEntity != null && dateEntity != null) {
            next({
                response: [itemsEntity.entity, dateEntity.entity]
            });
        } else if (itemsEntity != null) {
            next({
                response: [itemsEntity.entity, null]
            });
        } else if (dateEntity != null) {
            next({
                response: [null, dateEntity.entity]
            });
        } else {
            next({
                response: [null, null]
            });
        }

    },
    function (session, results, next) {

        var items = results.response[0];
        var date = results.response[1];
        // Async search
        Store
            .findItems(items, date)
            .then(function (listOfItems) {
                // args
                session.send('I found %d items:', listOfItems.length);
                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(listOfItems.map(itemAsAttachment));

                session.send(message);
                session.send(selectedItem);
                next();
                // session.endDialog();
            });
        //builder.Prompts.text(session, "select an item");
    },
    function (session) {
        builder.Prompts.text(session, "Can you please provide why you want to return ?");
    },
    function (session, results) {
        console.log(results.response);
        session.userData.returnReason = results.response;
        session.send("Thanks for your response.");
        builder.Prompts.choice(session, 'Please select a return method', ['A', 'B', 'C', 'Drop at Post Office']);
    },
    function (session, results) {
        session.userData.returnMethod = results.response.entity;
        session.send('You selected ' + session.userData.returnMethod + ' return method.');
        session.send('Okay. The nearest Post Office to your delivery address is:');
        session.send('Broadway Post Office\n\n1 Broadway,\n\nWestminster,\n\nLondon SW1H 0AX');
        session.endDialog();
    }
]).triggerAction({
    matches: 'returnItem',
    onInterrupted: function (session) {
        session.send('Please provide information');
    }
});

// Helpers
function itemAsAttachment(item) {
    // console.log("session"+ session);
    // console.log("item:"+ item);
    return new builder.HeroCard()
        .title(item.name)
        // .subtitle('COLOUR : %s',item)
        .images([new builder.CardImage().url(item.image)])
        .buttons([new builder.CardAction().title('Select').type('openUrl').value('http://google.com')
        ]);
}
// // Add help dialog
