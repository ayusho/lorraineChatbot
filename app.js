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
                session.send('Hi ' + customer.name + ', of course. We are processing your request. Please wait for a moment...');
                setTimeout(function () {
                    next({
                        response: [startDate, endDate, itemType]
                    });
                }, 2000);
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
        var startDate = results.response[0];
        var endDate = results.response[1];
        var itemType = results.response[2];
        // Async search
        Store.findItems(customer.customer_id, startDate, endDate, itemType).then(function (listOfItems) {
            // args
            returnItems = listOfItems;
            if (startDate == null || startDate == undefined || startDate == '') {
                session.send('I found %d items you bought:', listOfItems.length);
            }
            else {
                session.send('I found %d items you bought on %s:', listOfItems.length, startDate);
            }
            var message = new builder.Message().attachmentLayout(builder.AttachmentLayout.carousel).attachments(listOfItems.map(function (item) {
                return new builder.HeroCard(session).title(item.name).images([new builder.CardImage().url(item.image)]).buttons([ /*builder.CardAction.imBack(session, ('You selected: ' + item.name), item.name),*/ builder.CardAction.postBack(session, ('You selected: ' + item.productId + ',' + item.name), item.name)]);
                // .builder.CardAction.postBack(session, item.name, itemAsAttachment.name)
            }));
            session.send(message);
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
        session.send('Please provide information');
    }
});
bot.dialog('/returnReason', [
    function (session, args) {
        console.log("item list inside returnReason " + JSON.stringify(args));
        productSelectedForReturned = args.intent.matched[0].replace('You selected: ', '').split(',');
        console.log(":) selected item is " + typeof (productSelectedForReturned));
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
        session.send('Please provide information');
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
        }, 2000);
    }

]);
bot.dialog('/instructions', [
    function (session) {
        session.send('Return Instructions: Cut out Royal Mail return label from your Customer Advice Note and stick this on the original packaging.');
        session.send('Next, repack the top and the advice note inside so that it is ready for collection.');
        setTimeout(function () {
            session.beginDialog('/endReturn');
        }, 2000);
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
            session.send('Okay thanks Alison, goodbye');
        }
        session.endDialog();
    }
]);
//----------------------------------------------orderItem
bot.dialog('orderItem', [
    function (session, args, next) {
        console.log(args.intent.entities);
        var count = 0;
        var size = null;
        for (i = 0; i < args.intent.entities.length; i++) {
            if (args.intent.entities[i].type == 'color-item') {
                var res = args.intent.entities[i].entity.split(" ");
                if (res[1] == 'skirt') size = 14;
                else if (res[1] == 'blouse') size = 12;
                orderData.push({
                    itemColor: res[0]
                    , itemName: res[1]
                    , itemSize: size
                })
            }
        }
        console.log("orderdata:" + JSON.stringify(orderData));
        getCustomerData().then(function () {
            session.send('Hi ' + customer.name + ', of course. We are processing your request. Please wait for a moment...');
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
});
/*bot.dialog('/orderLooping', [
     function (session) {
        console.log("inside order looping " + session.userData.counterItems);

        console.log("counter item" + session.userData.counterItems);
        console.log(JSON.stringify(orderData));
        while (session.userData.counterItems < orderData.length) {

            if (orderData[session.userData.counterItems].itemSize == null) {
                session.userData.currentOrderData = orderData[session.userData.counterItems];
                console.log("currentOrderdata: " + JSON.stringify(session.userData.currentOrderData));
                session.beginDialog('/orderSizeInput', session.userData.currentOrderData);
                //continue;
            }
            session.userData.counterItems++;
        }
        session.endDialog();
    }
]);*/
bot.dialog('/orderSizeInput', [

    function (session, args, next) {
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
        session.send('These are the tailored ' + orderData[counter].itemColor + ' ' + orderData[counter].itemName + ' we have available in size ' + orderData[counter].itemSize);
        Store.findOrderItems(orderData[counter].itemName, orderData[counter].itemColor, orderData[counter].itemSize).then(function (listOfItemsToOrder) {
            // args
            var message = new builder.Message().attachmentLayout(builder.AttachmentLayout.carousel).attachments(listOfItemsToOrder.map(function (item) {
                return new builder.HeroCard(session).title(item.name).images([new builder.CardImage().url(item.image)]).title(item.name).subtitle('€' + item.price).buttons([builder.CardAction.postBack(session, ('Added to Bag ' + item.name + ',' + item.productId), item.name)]);
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
        session.userData.afterItemOrderedyesOrNo = results.response.entity;
        console.log("afterItemOrdered " + results.response.entity);
        if (session.userData.afterItemOrderedyesOrNo == 'No') {
            for (var i in itemsOrdered) {
                var counter = 0;
                Store.sendSelectedItemForOrder(itemsOrdered[i].productId, itemsOrdered[i].customerId).then(function (responseValue) {
                    if (responseValue == 'success') counter += 1;
                    else session.send("Something went wrong...");
                    if (counter == itemsOrdered.length) {
                        session.beginDialog('/orderDeliveryAddress');
                    }
                });
            }
            //session.beginDialog('/orderDeliveryAddress');
        }
        //session.endDialog();
    }
]);
bot.dialog('/orderDeliveryAddress', [
    function (session) {
        itemsOrdered = [];
        builder.Prompts.choice(session, 'Okay, would you like order delivered to your home address?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }



    
    , function (session, results) {
        session.userData.orderDeliveryAddressResponse = results.response.entity;
        console.log("orderDeliveryAddress " + results.response.entity);
        if (session.userData.orderDeliveryAddressResponse == 'Yes') {
            session.beginDialog('/deliveryType');
        }
        else if (session.userData.orderDeliveryAddressResponse == 'No') {
            session.beginDialog('/deliveryType');
        }
        //session.endDialog();
    }
]);
bot.dialog('/deliveryType', [
    function (session) {
        builder.Prompts.choice(session, 'Great and would you like Standard delivery for £3.50 or Next day delivery for £6.50?', ['Standard', 'Next Day'], {
            listStyle: builder.ListStyle.button
        });
    }


    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Next Day') {
            session.beginDialog('/paymentType');
        }
        else if (session.userData.yesOrNo == 'Standard') {
            session.beginDialog('/paymentType');
        }
        //session.endDialog();
    }
]);
bot.dialog('/paymentType', [
    function (session) {
        builder.Prompts.choice(session, 'Excellent, and would you like to pay with your JD Williams Shopping Account?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }


    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Yes') {
            session.beginDialog('/confirmDelivery');
        }
        else if (session.userData.yesOrNo == 'No') {
            session.beginDialog('/confirmDelivery');
        }
        //session.endDialog();
    }
]);
bot.dialog('/confirmDelivery', [
    function (session) {
        var itemsNames = '';
        for (var i in productArraySelectedForOrder) {
            itemsNames = itemsNames + ', ' + productArraySelectedForOrder[i]
        }
        builder.Prompts.choice(session, 'Perfect. Can you confirm that you would like to purchase ' + itemsNames + ' on your account today?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }


    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'Yes') {
            session.beginDialog('/endOrder');
        }
        //session.endDialog();
    }
]);
bot.dialog('/endOrder', [
    function (session) {
        session.send('Your order will be with you tomorrow Alison, I hope you like it. Thank you for shopping with us :)')
        builder.Prompts.choice(session, 'Is there anything else I can help you with?', ['Yes', 'No'], {
            listStyle: builder.ListStyle.button
        });
    }


    
    , function (session, results) {
        session.userData.yesOrNo = results.response.entity;
        if (session.userData.yesOrNo == 'No') {
            orderData = [];
            counter = 0;
            productArraySelectedForOrder = [];
            session.endConversation('Talk to you again soon Alison, goodbye');
        }
        /*session.endDialog();
bot.send('/deleteprofile');*/
    }
]);
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
                    //                    itemsOrdered.push({
                    //                        customerId: customer.customer_id;
                    //                    })
                }
                //builder.Prompts.number(session, 'Hi ' + customer.name + ', I would be happy to help you.');
                setTimeout(function () {
                    resolve(customer);
                }, 1000);
            });
        });
        req.on('error', function (e) {
            console.log('problem with requ  est: ' + e.message);
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