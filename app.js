
// This loads the environment variables from the .env file
require('dotenv-extended').load();

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

// var products = [
//     {product_id : 1,name : 'LORRAINE KELLY SCUBA FIT & FLARE DRESS',quantity : 10,1,70,NULL},
//     {product_id : 2,name : 'BLACK TROPICAL PRINT SHIRRED BODYCON DRESS',quantity : 10,1,35,NULL},
//     {product_id : 3,name : 'PLEATED PLEAT SKIRT MAXI DRESS',quantity : 10,1,65,NULL},
//     {product_id : 4,name : 'JOANNA HOPE GYPSY MAXI DRESS',quantity : 10,1,45,NULL},
//     {product_id : 5,name : 'JOANNA HOPE GYPSY MAXI DRESS',quantity : 10,1,45,NULL},
//     {product_id : 6,name : 'BELL SLEEVE LACE DRESS',quantity : 10,1,75,NULL},
//     {product_id : 7,name : 'BELL SLEEVE LACE DRESS',quantity : 10,1,75,NULL},
//     {product_id : 8,name : 'BLACK/RED FLORAL SPLIT SLEEVE MAXI DRESS',quantity : 10,1,45,NULL},
//     {product_id : 9,name : 'LORRAINE KELLY BURNOUT FIT & FLARE',quantity : 10,1,65,NULL},
//     {product_id : 10,name : 'BLACK SHORT SLEEVE V NECK BARDOT TOP',quantity : 10,2,15,NULL},
//     {product_id : 11,name : 'PLEAT CAMISOLE',quantity : 10,2,10,NULL},
//     {product_id : 12,name : 'PLEAT CAMISOLE',quantity : 10,2,10,NULL},
//     {product_id : 13,name : 'PLEAT CAMISOLE',quantity : 10,2,10,NULL},
//     {product_id : 14,name : 'COLD SHOULDER GYPSY TOP',quantity : 10,2,20,NULL},
//     {product_id : 15,name : 'COLD SHOULDER GYPSY TOP',quantity : 10,2,20,NULL},
//     {product_id : 16,name : 'PRINT GYPSY JERSEY TOP',quantity : 10,2,20,NULL},
//     {product_id : 17,name : 'DROP SLEEVE SHELL TOP',10,2,16,NULL},
//     {product_id : 18,name : 'PREMIUM SHAPE AND SCULPT MID BLUE HIGH WAISTED BOO',10,5,40,NULL},
//     {product_id : 19,name : 'NIGHTINGALES TIERED DRESS',10,1,59,NULL},
//     {product_id : 20,name : 'LORRAINE KELLY FLORAL CHIFFON SKIRT',10,9,55,NULL},
//     {product_id : 21,name : 'DOBBY SLEEVE WRAP SHIRT',10,7,22,NULL}
// ]

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
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
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
        }
        else if (itemsEntity != null) {
            next({
                response: [itemsEntity.entity, null]
            });
        }
        else if (dateEntity != null) {
            next({
                response: [null, dateEntity.entity]
            });
        }
        else {
            next({
                response: [null, null]
            });
        }

    },
    function (session, results, next) {
        // if (results.response[0] != null) {
        //     var items = results.response[0];
        //     if (results.response.length == 2)
        //         var date = results.response[1];
        // }
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

                // while (selectedItem != null);
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

// bot.dialog('itemSelected', [
//     function (session, args, next) {
//         // // Get color and optional size from users utterance
//         // //var utterance = args.intent.matched[0];
//         // //var color = /(white|gray)/i.exec(utterance);
//         // //var size = /\b(Extra Large|Large|Medium|Small)\b/i.exec(utterance);
//         // //if (color) {
//         //     // Initialize cart item
//         //     var item = session.dialogData.item = { 
//         //         product: "classic " + color[0].toLowerCase() + " t-shirt",
//         //         size: size ? size[0].toLowerCase() : null,
//         //         price: 25.0,
//         //         qty: 1
//         //     };
//         //     if (!item.size) {
//         //         // Prompt for size
//         //         builder.Prompts.choice(session, "What size would you like?", "Small|Medium|Large|Extra Large");
//         //     } else {
//         //         //Skip to next waterfall step
//         //         next();
//         //     }
//         // } else {
//         //     // Invalid product
//         //     session.send("I'm sorry... That product wasn't found.").endDialog();
//         // }   
//         session.send("You have made a selection");
//     }//,
//     // function (session, results) {
//     //     // Save size if prompted
//     //     var item = session.dialogData.item;
//     //     if (results.response) {
//     //         item.size = results.response.entity.toLowerCase();
//     //     }

//     //     // Add to cart
//     //     if (!session.userData.cart) {
//     //         session.userData.cart = [];
//     //     }
//     //     session.userData.cart.push(item);

//     //     // Send confirmation to users
//     //     session.send("A '%(size)s %(product)s' has been added to your cart.", item).endDialog();
//     // }
// ]).triggerAction({ matches: 'wehjbfkfkjadsgfakjsnfjs' });
// Helpers
function itemAsAttachment(item) {
    return new builder.HeroCard()
        .title(item.name)
        .subtitle('COLOUR : %s', item.color)
        .images([new builder.CardImage().url(item.image)]);
    // .button([
    //     builder.CardAction.imBack(session, "wehjbfkfkjadsgfakjsnfjs", "Select")
    // ]);
}
// // Add help dialog
// bot.dialog('help', function (session) {
//     session.send("I'm a simple echo bot.");
// }).triggerAction({
//     matches: /^help/i
// });
// function getData(item) {
//     selectedItem = 'You selected ' + item.name;
// }