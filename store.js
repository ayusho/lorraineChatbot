var Promise = require('bluebird');
var http = require('http');
var exec = require('child_process').exec;
var child;
var itemsJSON;

module.exports = {
    findItems: function (customerId, startDate, endDate, itemType) {
        return new Promise(function (resolve) {
            var pathData = '/api/getReturnItems?customer_id=' + customerId;
            if (startDate != null)
                pathData += '&start_date=' + startDate;
            if (endDate != null)
                pathData += '&end_date=' + endDate;
            if (itemType != null)
                pathData += '&item=' + itemType;
            console.log('lorrainewebservice.azurewebsites.net' + pathData);
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: pathData,
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log("stdout: " + stdout);
                        itemsJSON = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        var listOfItems = [];
                        for (var i in itemsJSON) {
                            listOfItems.push({
                                name: itemsJSON[i].NAME,
                                image: 'https://jdwiilliamsimages.blob.core.windows.net/jd-williams-images/images/' + itemsJSON[i].PRODUCT_ID + '.jpeg',
                                timestamp: itemsJSON[i].TIMESTAMP,
                                productId: itemsJSON[i].PRODUCT_ID,
                                orderItemId: itemsJSON[i].ORDER_ITEM_ID
                            });
                            console.log("http itemname" + itemsJSON[i].NAME);
                        }
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(listOfItems);
                        }, 2000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    },
    findOrderItems: function (itemName, itemColor, itemSize) {
        return new Promise(function (resolve) {
            var pathData = '/api/displayItems?name=' + itemName;
            if (itemColor != null)
                pathData += '&color=' + itemColor;
            if (itemSize != null)
                pathData += '&size=' + itemSize;
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: pathData, //path: '/api/displayItems?name=blouse&color=white&size=12',
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        itemsJSON = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        var listOfItemsToOrder = [];
                        for (var i in itemsJSON) {
                            listOfItemsToOrder.push({
                                name: itemsJSON[i].name,
                                image: 'https://jdwiilliamsimages.blob.core.windows.net/jd-williams-images/images/' + itemsJSON[i].product_id + '.jpeg',
                                price: itemsJSON[i].price,
                                productId: itemsJSON[i].product_id,
                                size: itemsJSON[i].size
                            });
                            console.log("http itemname" + itemsJSON[i].name);
                        }
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(listOfItemsToOrder);
                        }, 1000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    },
    sendSelectedItemForReturn: function (orderItemId, reason) {
        return new Promise(function (resolve) {
            reason = reason.split(' ').join('%20');
            console.log(reason);
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: '/api/addReturn?reason=' + reason + '&order_item_id=' + orderItemId //path: '/api/displayItems?name=blouse&color=white&size=12',   

                    ,
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                res.setEncoding('utf8');
                console.log("options: " + JSON.stringify(options));
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        var response = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(response.status);
                        }, 1000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    },
    createOrderItemId: function (customerId) {
        return new Promise(function (resolve) {
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: '/api/addOrders?customer_id=' + customerId + '',
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        var response = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(response.status);
                        }, 1000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    },
    sendSelectedItemForOrder: function (customerId, productId) {
        return new Promise(function (resolve) {
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: '/api/addOrderItem?customer_id=' + customerId + '&product_id=' + productId,
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        var response = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(response.status);
                        }, 1000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    },
    logConversation: function (conversationId, customerId, intent, intentConfidence, userInput, botOutput) {
        return new Promise(function (resolve) {
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: '/api/addConversation?conversation_id=' + conversationId + '&customer_id=' + customerId + '&intent=' + intent + '&intent_confidence=' + intentConfidence + '&entity=entites&entity_value=0&entity_confidence=0.3&nodes_visited=0&user_input=' + userInput + '&bot_output=' + botOutput,
                method: 'GET'
            };
            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        var response = JSON.parse(stdout);
                        //console.log("http called inside promise---" + itemsJSON[1].NAME);
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(response.status);
                        }, 1000);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write('data\n');
            req.write('data\n');
            req.end();
        });
    }
};
