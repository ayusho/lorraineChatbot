var restify = require('restify');
var builder = require('botbuilder');
var Store = require('./store');
var spellService = require('./spell-service');
var exec = require('child_process').exec;
var http = require('http');
var child;
//=========================================================
// Dummy Data
//=========================================================
var customer = [
    {
        customer_id: ''
        , name: ''
        , email: ''
        , phone: ''
        , address: ''
    }
];
var customerListJSON;
var returnItems;
var productSelectedForReturned;
var productSelectedForOrder;
var productArraySelectedForOrder = [];
var itemsOrdered = [];
var orderData = [];
var counter = 0;
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
    appId: 'c4d12a93-c875-47ca-9700-28e949ec657a'
    , appPassword: 'spZVMeScmRcN7QdP3afw5wE'
});
server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});
// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer('https://eastus2.api.cognitive.microsoft.com/luis/v2.0/apps/8f41eeac-f694-43f1-94bf-5a330839b626?subscription-key=632517c4179c4614bc024213023c6025&verbose=true&timezoneOffset=0&q=');
bot.recognizer(recognizer);
//Log every message
//const logUserConversation = (event) => {
//    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
//};
//
//// Middleware for logging
//bot.use({
//    receive: function (event, next) {
//        logUserConversation(event);
//        next();
//    },
//    send: function (event, next) {
//        logUserConversation(event);
//        next();
//    }
//});
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
                }
                else /*if (args.intent.entities[i].resolution.values[0].type == 'daterange') */ {
                    console.log("inside daterange");
                    startDate = args.intent.entities[i].resolution.values[0].start;
                    endDate = args.intent.entities[i].resolution.values[0].end;
                }
            }
            else if (args.intent.entities[i].type == 'items') itemType = args.intent.entities[i].resolution.values[0];
        }
        console.log("start date : " + startDate);
        console.log("end date : " + endDate);
        console.log("item : " + itemType);
        var options = {
            host: 'lorrainewebservice.azurewebsites.net'
            , path: '/api/getCustomerList'
            , method: 'GET'
        };
        var req = http.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (stdout) {
                if (stdout) {
                    console.log('BODY: ' + stdout);
                    console.log("inside http request called");
                    customerListJSON = JSON.parse(stdout);
                    console.log(customerListJSON[0].name);
                    customer.customer_id = customerListJSON[0].customer_id;
                    customer.name = customerListJSON[0].name;
                    customer.email = customerListJSON[0].email;
                    customer.phone = customerListJSON[0].phone;
                    customer.address = customerListJSON[0].address;
                }
                session.send('Hi Alison, of course. I\'ll have a look at your order history, just one moment please.');
                setTimeout(function () {
                    next({
                        response: [startDate, endDate, itemType]
                    });
                }, 1000);
            });
        });
        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        // write data to request body
        req.write('data\n');
        req.write('data\n');
        req.end();
    }
























    
    , function (session, results, next) {
        console.log('inside next function ');
        var startDate = results.response[0];
        var endDate = results.response[1];
        var itemType = results.response[2];
        console.log(":) " + customer.customer_id + startDate + ' ' + endDate + ' ' + itemType);
        // Async search
        Store.findItems(customer.customer_id, startDate, endDate, itemType).then(function (listOfItems) {
            // args
            var localItemsDate = [];
            var localItemsList = [];
            //console.log("listofitems *****" + typeof (listOfItems[0].timestamp));
            returnItems = listOfItems;
            for (var i in listOfItems) {
                var date = listOfItems[i].timestamp.slice(0, 10);
                localItemsDate.push(date);
            }
            var commonDates = localItemsDate.filter(function (item, index, inputArray) {
                return inputArray.indexOf(item) == index;
            });
            if (startDate == null || startDate == undefined || startDate == '') {
                session.send('I found %d orders, please select the item from the order that you wish to return:', listOfItems.length);
            }
            else {
                session.send('I found %d orders from %s, please select the item from the order that you wish to return:', listOfItems.length, startDate);
            }
            for (var i in commonDates) {
                localItemsList.push({
                    date: commonDates[i]
                    , products: []
                });
            }
            for (var i in localItemsList) {
                for (var j in listOfItems) {
                    if (listOfItems[j].timestamp.includes(localItemsList[i].date)) {
                        localItemsList[i].products.push({
                            name: listOfItems[j].name
                            , image: listOfItems[j].image
                            , productId: listOfItems[j].productId
                            , orderItemId: listOfItems[j].orderItemId
                        });
                    }
                }
            }
            console.log("local json" + JSON.stringify(localItemsList));
            for (var i in localItemsList) {
                var message = new builder.Message().attachmentLayout(builder.AttachmentLayout.carousel).attachments(localItemsList[i].products.map(function (item) {
                    return new builder.HeroCard(session).title(item.name).images([new builder.CardImage().url(item.image)]).buttons([ /*builder.CardAction.imBack(session, ('You selected: ' + item.name), item.name),*/ builder.CardAction.postBack(session, ('You selected: ' + item.orderItemId + ',' + item.name), item.name)]);
                    // .builder.CardAction.postBack(session, item.name, itemAsAttachment.name)
                }));
                session.send('These are the products you bought on ' + localItemsList[i].date);
                session.send(message);
            }
            //session.send(selectedItem);
            //next();
            // session.beginDialog('/returnReason');
            session.endDialog();
        });
        //builder.Prompts.text(session, "select an item");
    },

]).triggerAction({
    matches: 'returnItem'
    , onInterrupted: function (session) {
        session.send('Please select one of these items...');
    }
});
bot.dialog('/returnReason', [
    function (session, args) {
        console.log("item list inside returnReason " + JSON.stringify(args));
        productSelectedForReturned = args.intent.matched[0].replace('You selected: ', '').split(',');
        console.log(":) selected item is " + productSelectedForReturned);
        var productIdSelectedForReturn = matchReturnItem(returnItems, productSelectedForReturned[0]);
        console.log(":) item id" + productIdSelectedForReturn);
        builder.Prompts.text(session, 'Please can you tell me why you are returning ' + productSelectedForReturned[1] + '?');
    }





































    
    , function (session, results) {
        console.log(results.response);
        session.userData.returnReason = results.response;
        console.log("reason" + results.response + ' ' + productSelectedForReturned[0]);
        Store.sendSelectedItemForReturn(productSelectedForReturned[0], results.response).then(function (responseValue) {
            if (responseValue == "success") {
                session.send("Thanks for your response.");
                setTimeout(function () {
                    session.beginDialog('/returnMethod');
                }, 1000);
            }
            else {
                session.send("Some problem occurred while processing...");
            }
        })
    }]).triggerAction({
    matches: /^You selected.*/
    , onInterrupted: function (session) {
        session.send('Please select one of these...');
    }
});
bot.dialog('/returnMethod', [
    function (session) {
        builder.Prompts.choice(session, 'Can you select the return method you wish to use', ['Arrange Hermes Courrier', 'Drop at Hermes Parcel Shop', 'Use InPost 24/7 Parcel Locker', 'Drop at Post Office'], {
            listStyle: builder.ListStyle.button
        });
    }





































    
    , function (session, results) {
        session.userData.returnMethod = results.response.entity;
        session.send('Okay. The nearest Post Office to your delivery address is:');
        session.send('Broadway Post Office\n\n1 Broadway,\n\nWestminster,\n\nLondon SW1H 0AX');
        setTimeout(function () {
            session.beginDialog('/instructions');
        }, 4000);
    }

]);
bot.dialog('/instructions', [
    function (session) {
        session.send('Return Instructions: Cut out Royal Mail return label from your Customer Advice Note and stick this on the original packaging.');
        session.send('Next, repack the top and the advice note inside so that it is ready for collection.');
        setTimeout(function () {
            session.beginDialog('/endReturn');
        }, 5000);
    }
]);
bot.dialog('/endReturn', [
    function (session) {
        builder.Prompts.choice(session, 'Is there anything else I can help you with?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }







































    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'No') {
            //session.message.user.name.split(' ')[0]
            session.send('Okay thanks Alison, goodbye');
        }
        session.endDialog();
    }
]);
//----------------------------------------------orderItem
bot.dialog('orderItem', [
    function (session, args, next) {
        var items = '';
        console.log(args.intent.entities);
        var count = 0;
        var size = null;
        for (i = 0; i < args.intent.entities.length; i++) {
            if (args.intent.entities[i].type == 'color-item') {
                var res = args.intent.entities[i].entity.split(" ");
                if (res[1] == 'skirt') size = 14;
                else if (res[1] == 'blouse') size = 12;
                else if (res[1] == 'top') size = 12;
                else if (res[1] == 'dress') size = 14;
                items += res[1] + ' ';
                orderData.push({
                    itemColor: res[0]
                    , itemName: res[1]
                    , itemSize: size
                });
            }
            console.log(args.intent.entities[i].type == 'items' && items.indexOf(args.intent.entities[i].entity) == -1);
            if (args.intent.entities[i].type == 'items' && items.indexOf(args.intent.entities[i].entity) == -1) {
                var res = args.intent.entities[i].entity;
                if (res == 'skirt') size = 14;
                else if (res == 'blouse') size = 12;
                else if (res == 'top') size = 12;
                else if (res == 'dress') size = 14;
                orderData.push({
                    itemColor: null
                    , itemName: res
                    , itemSize: size
                });
            }
        }
        console.log("orderdata:" + JSON.stringify(orderData));
        getCustomerData().then(function () {
            session.send('Hi Alison, of course. I\'m happy to help. I\'ll show you what we have available in your size, just one moment please.');
            session.userData.counterItems = 0;
            //session.beginDialog('/orderLooping');
            session.beginDialog('/orderSizeInput');
            //session.endDialog();
        });
    }


]).triggerAction({
    matches: 'orderItem'
    , onInterrupted: function (session) {
        session.send('Please provide information');
    }
}).cancelAction('cancelList', "Conversation canceled", {
    matches: /^cancel/i
    , confirmPrompt: "Are you sure?"
}).reloadAction('reloadBuy', "Restarting order.", {
    matches: /^start over/i
    , confirmPrompt: "are you sure?"
});
bot.dialog('/orderSizeInput', [

    function (session, args, next) {
        console.log(JSON.stringify(orderData));
        console.log('cungfe : ' + counter);
        if (orderData[counter].itemSize == null) {
            builder.Prompts.number(session, 'What size of ' + orderData[counter].itemColor + ' ' + orderData[counter].itemName + ' would you like to order?');
            console.log("after prompt");
        }
        else {
            next({
                response: null
            });
        }
    }






































    
    , function (session, results) {
        console.log("orderSizeInput function 2" + results.response);
        if (results.response != null) orderData[counter].itemSize = results.response;
        //session.userData.selectedItems = [];
        Store.findOrderItems(orderData[counter].itemName, orderData[counter].itemColor, orderData[counter].itemSize).then(function (listOfItemsToOrder) {
            // args
            session.send('These are the tailored ' + orderData[counter].itemColor + ' ' + orderData[counter].itemName + ' we have available in size ' + orderData[counter].itemSize);
            var message = new builder.Message().attachmentLayout(builder.AttachmentLayout.carousel).attachments(listOfItemsToOrder.map(function (item) {
                return new builder.HeroCard(session).title(item.name).images([new builder.CardImage().url(item.image)]).title(item.name).subtitle('€' + item.price).buttons([builder.CardAction.postBack(session, ('Added to Bag ' + item.name + ' Size: ' + item.size + ',' + item.productId), item.name)]);
            }));
            session.send(message);
            //session.beginDialog('/afterItemSelected');
            session.endDialog();
        });
    }

]);
bot.dialog('/afterItemSelected', [
    function (session, args) {
        productSelectedForOrder = args.intent.matched[0].replace('Added to Bag ', '').split(',');
        console.log("ordered item is :)" + productSelectedForOrder[0] + "and " + productSelectedForOrder[1]);
        productArraySelectedForOrder.push(productSelectedForOrder[0]);
        itemsOrdered.push({
            productId: productSelectedForOrder[1]
            , customerId: customer.customer_id
        });
        console.log("items ordered: " + JSON.stringify(itemsOrdered));
        counter = counter + 1;
        if (counter < orderData.length) {
            session.send('That\'s lovely, great choice');
            session.beginDialog('/orderSizeInput');
        }
        else session.beginDialog('/afterItemOrdered');
        //session.endDialog();
    }
]).triggerAction({
    matches: /Added.*/
    , onInterrupted: function (session) {
        session.send('Please provide information');
    }
});
bot.dialog('/afterItemOrdered', [
    function (session) {
        builder.Prompts.choice(session, 'Wonderful, you deserve it! Would you like to order anything else today?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }




































    
    , function (session, results) {
        /*session.userData.afterItemOrderedyesOrNo = results.response.entity;
console.log("afterItemOrdered yes or no " + results.response.entity);*/
        //console.log(results.response.entity == 'No');
        if (results.response.entity == 'No') {
            session.beginDialog('/deliveryType');
            //console.log("customer: " + itemsOrdered[0].customerId);
            //session.beginDialog('/orderDeliveryAddress');
        }
        //session.endDialog();
}]).cancelAction('cancelList', "Action canceled", {
    matches: /^cancel/i
    , confirmPrompt: "Are you sure?"
});
bot.dialog('/deliveryType', [
    function (session) {
        builder.Prompts.choice(session, 'Great and would you like Standard delivery for £3.50 or Next day delivery for £6.50?', ['Standard', 'Next Day'], {
            listStyle: builder.ListStyle.button
        });
    }




































    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Next Day') {
            session.beginDialog('/addPreference');
        }
        else if (session.userData.yesOrNo == 'Standard') {
            session.beginDialog('/addPreference');
        }
        //session.endDialog();
    }
]);
bot.dialog('/addPreference', [
    function (session) {
        builder.Prompts.choice(session, 'Would you like me to add that choice to your account preferences Alison?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }





































    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Yes') {
            session.beginDialog('/confirmUsingPreference');
        }
        else if (session.userData.yesOrNo == 'No') {
            session.beginDialog('/confirmUsingPreference');
        }
        //session.endDialog();
    }
]);
bot.dialog('/confirmUsingPreference', [
    function (session) {
        builder.Prompts.choice(session, 'Great. I will use your account preferences to complete this order. Is that okay?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }




































    
    , function (session, results) {
        session.userData.orderDeliveryAddressResponse = results.response.entity;
        console.log("orderDeliveryAddress " + results.response.entity);
        if (session.userData.orderDeliveryAddressResponse == 'Yes') {
            session.beginDialog('/confirmDelivery');
        }
        else if (session.userData.orderDeliveryAddressResponse == 'No') {
            session.beginDialog('/confirmDelivery');
        }
        //session.endDialog();
    }
]);
bot.dialog('/confirmDelivery', [
    function (session) {
        var itemsNames = '';
        itemsNames = productArraySelectedForOrder[0];
        for (i = 1; i < productArraySelectedForOrder.length; i++) itemsNames = itemsNames + ', ' + productArraySelectedForOrder[i]
        builder.Prompts.choice(session, 'Perfect. Can you confirm that you would like to purchase ' + itemsNames + ' on your account today?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }





































    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Yes') {
            Store.createOrderItemId(itemsOrdered[0].customerId).then(function (responseOrder) {
                console.log("Inside create order");
                if (responseOrder == 'success') {
                    var counter = 0;
                    for (var i in itemsOrdered) {
                        Store.sendSelectedItemForOrder(itemsOrdered[i].customerId, itemsOrdered[i].productId).then(function (responseValue) {
                            console.log("Inside order item push");
                            if (responseValue == 'success') counter += 1;
                            else session.send("Something went wrong...");
                            if (counter == itemsOrdered.length) {
                                itemsOrdered = [];
                                session.beginDialog('/endOrder');
                            }
                        });
                    }
                }
                else session.send("Something went wrong...");
            })
        }
        //session.endDialog();
    }
]);
bot.dialog('/endOrder', [
    function (session) {
        session.send('Your order will be with you soon Alison, I hope you like it. Thank you for shopping with us :)');
        orderData = [];
        counter = 0;
        productArraySelectedForOrder = [];
        session.endConversation();
    }
]);
bot.dialog('/endConversation', function (session) {
    orderData = [];
    counter = 0;
    customer = [];
    customerListJSON = [];
    returnItems = [];
    productSelectedForReturned = [];
    productSelectedForOrder = [];
    productArraySelectedForOrder = [];
    itemsOrdered = [];
    orderData = [];
    counter = 0;
    session.endConversation("Seems like you want to abort the conversation. Thank you.");
}).triggerAction({
    matches: /Exit.*/i
});
bot.dialog('/greetings', [
    function (session) {
        session.send('Hey Alison, how may I help you?');
    }
]).triggerAction({
    matches: 'greetings'
, });
//helper functions
function getCustomerData() {
    return new Promise(function (resolve) {
        var options = {
            host: 'lorrainewebservice.azurewebsites.net'
            , path: '/api/getCustomerList'
            , method: 'GET'
        };
        var req = http.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (stdout) {
                if (stdout) {
                    console.log('BODY: ' + stdout);
                    console.log("inside http request called");
                    customerListJSON = JSON.parse(stdout);
                    console.log(customerListJSON[0].name);
                    customer.customer_id = customerListJSON[0].customer_id;
                    customer.name = customerListJSON[0].name;
                    customer.email = customerListJSON[0].email;
                    customer.phone = customerListJSON[0].phone;
                    customer.address = customerListJSON[0].address;
                    //itemsOrdered.push({
                    //    customerId: customer.customer_id;
                    //})
                }
                //builder.Prompts.number(session, 'Hi ' + customer.name + ', I would be happy to help you.');
                setTimeout(function () {
                    resolve(customer);
                }, 1000);
            });
        });
        req.on('error', function (e) {
            console.log('Problem with request: ' + e.message);
        });
        // write data to request body
        req.write('data\n');
        req.write('data\n');
        req.end();
    })
}

function matchReturnItem(list, itemName) {
    console.log(":) list" + JSON.stringify(list));
    console.log(":) itemName" + itemName);
    for (var i in list) {
        console.log("inside for loop " + i)
        if (list[i].name == itemName) {
            console.log("found match")
            return list[i].productId;
        }
    }
    return 11;
}