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
        var startDate, endDate, itemType;

        for (i = 0; i < args.intent.entities.length; i++) {
            if (args.intent.entities[i].type == 'builtin.datetimeV2.date' || args.intent.entities[i].type == 'builtin.datetimeV2.daterange' || args.intent.entities[i].type == 'builtin.datetimeV2.datetimerange') {
                if (args.intent.entities[i].resolution.values[0].type == 'date') {
                    startDate = args.intent.entities[i].resolution.values[0].value;
                    endDate = null;
                } else /*if (args.intent.entities[i].resolution.values[0].type == 'daterange') */ {
                    console.log("inside daterange");
                    startDate = args.intent.entities[i].resolution.values[0].start;
                    endDate = args.intent.entities[i].resolution.values[0].end;
                }
            } else if (args.intent.entities[i].type == 'items')
                itemType = args.intent.entities[i].resolution.values[0];
        }

        console.log("start date : " + startDate);
        console.log("end date : " + endDate);
        console.log("item : " + itemType);

        session.send('Hi Alison, of course. We are processing your request. Please wait for a moment...');

        next({
            response: [startDate, endDate, itemType]
        });

    },
    function (session, results, next) {

        var startDate = results.response[0];
        var endDate = results.response[1];
        var itemType = results.response[2];
        // Async search
        Store
            .findItems(startDate, endDate, itemType)
            .then(function (listOfItems) {
                // args
                if (startDate == null || startDate == undefined || startDate == '') {
                    session.send('I found %d items you bought:', listOfItems.length);
                } else {
                    session.send('I found %d items you bought on %s:', listOfItems.length, startDate);
                }

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(listOfItems.map(function (item) {
                        return new builder.HeroCard(session)
                            .title(item.name)
                            // .subtitle('COLOUR : %s',item)
                            .images([new builder.CardImage().url(item.image)])
                            //.buttons([new builder.CardAction(session).title('Select').type('openUrl').value('http://google.com')
                            .buttons([builder.CardAction.imBack(session, session.gettext('You selected: ' + item.name), 'Select')]);
                        // .builder.CardAction.postBack(session, item.name, itemAsAttachment.name)
                    }));
                session.send(message);
                //session.send(selectedItem);
                //next();
                bot.beginDialog('/returnReason');
                session.endDialog();
            });
        //builder.Prompts.text(session, "select an item");
    },

]).triggerAction({
    matches: 'returnItem',
    onInterrupted: function (session) {
        session.send('Please provide information');
    }
});
bot.dialog('/returnReason', [
    function (session) {
        builder.Prompts.text(session, "Please can you tell me why you are returning the item?");
    },
    function (session, results) {
        console.log(results.response);
        session.userData.returnReason = results.response;
        session.send("Thanks for your response.");
        session.beginDialog('/returnMethod');
    }]).triggerAction({
    matches: /^You selected.*/,
    onInterrupted: function (session) {
        session.send('Please provide information');
    }
});
bot.dialog('/returnMethod', [
    function (session) {
        builder.Prompts.choice(session, 'Can you select the return method you wish to use', ['Arrange Hermes Courrier', 'Drop at Hermes Parcel Shop', 'Use InPost 24/7 Parcel Locker', 'Drop at Post Office'], {
            listStyle: builder.ListStyle.button
        });
    },
    function (session, results) {
        session.userData.returnMethod = results.response.entity;
        session.send('Okay. The nearest Post Office to your delivery address is:');
        session.send('Broadway Post Office\n\n1 Broadway,\n\nWestminster,\n\nLondon SW1H 0AX');
        session.beginDialog('/instructions');

    }

]);
bot.dialog('/instructions', [
    function (session) {
        session.send('Return Instructions: Cut out Royal Mail return label from your Customer Advice Note and stick this on the original packaging.');
        session.send('Next, repack the top and the advice note inside so that it is ready for collection.');
        session.beginDialog('/endReturn');
    }
]);
bot.dialog('/endReturn', [
    function (session) {
        builder.Prompts.choice(session, 'Is there anything else I can help you with?', ['Yes', 'No']);
    },
    function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'No') {
            session.send('Okay thanks Alison, goodbye');
        }
        session.endDialog();
}
]);

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
