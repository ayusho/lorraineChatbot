var Promise = require('bluebird');
var http = require('http');
var exec = require('child_process').exec;
var child;
var itemsJSON;
var ReviewsOptions = [
    '“Very stylish, great stay, great staff”'
    , '“good hotel awful meals”'
    , '“Need more attention to little things”'
    , '“Lovely small hotel ideally situated to explore the area.”'
    , '“Positive surprise”'
    , '“Beautiful suite and resort”'];
module.exports = {
    findItems: function (customerId, startDate, endDate, itemType) {
        return new Promise(function (resolve) {
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                path: '/api/getReturnItems?customer_id=' + customerId + '&start_date=05-05-2017&item=' + itemType,
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
                        var listOfItems = [];
                        for (var i in itemsJSON) {
                            listOfItems.push({
                                name: itemsJSON[i].NAME,
                                image: 'https://jdwiilliamsimages.blob.core.windows.net/jd-williams-images/images/' + itemsJSON[i].PRODUCT_ID + '.jpeg',
                                timestamp: itemsJSON[i].TIMESTAMP
                            });
                            console.log("http itemname" + itemsJSON[i].NAME);
                        }
                        // complete promise with a timer to simulate async response
                        setTimeout(function () {
                            resolve(listOfItems);
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

    findOrderItems: function (itemName, itemColor, itemSize) {
        return new Promise(function (resolve) {
            var options = {
                host: 'lorrainewebservice.azurewebsites.net',
                // path: '/api/displayItems?name=' + itemName + '&color=' + itemColor + '&size=' + itemSize,
                path: '/api/displayItems?name=blouse&color=white&size=12',
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
                                price: itemsJSON[i].price
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
    }
};
