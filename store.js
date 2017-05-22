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
                host: 'lorrainewebservice.azurewebsites.net'
                , path: '/api/getReturnItems?customer_id=' + customerId + '&start_date=05-05-2017&item=' + itemType
                , method: 'GET'
            };
            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (stdout) {
                    if (stdout) {
                        console.log(stdout);
                        itemsJSON = JSON.parse(stdout);
                        console.log("http called inside promise---" + itemsJSON[1].NAME);
                        var listOfItems = [];
                        for (var i in itemsJSON) {
                            listOfItems.push({
                                name: itemsJSON[i].NAME
                                , image: 'https://jdwiilliamsimages.blob.core.windows.net/jd-williams-images/images/' + itemsJSON[i].PRODUCT_ID + '.jpeg'
                                , timestamp: itemsJSON[i].TIMESTAMP
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
            //            var curlCmd = 'curl -X GET "http://lorrainewebservice.azurewebsites.net/api/getReturnItems?customer_id=' + customerId + '&start_date=05-05-2017&item=' + itemType + '"';
            //            child = exec(curlCmd, function (error, stdout, stderr) {
            //                if (stdout) {
            //                    console.log(stdout);
            //                    itemsJSON = JSON.parse(stdout);
            //                    console.log(curlCmd);
            //                    console.log("curl called inside promise---" + itemsJSON[1].NAME);
            //                    var listOfItems = [];
            //                    for (var i in itemsJSON) {
            //                        listOfItems.push({
            //                            name: itemsJSON[i].NAME
            //                            , image: 'https://jdwiilliamsimages.blob.core.windows.net/jd-williams-images/images/' + itemsJSON[i].PRODUCT_ID + '.jpeg'
            //                            , timestamp: itemsJSON[i].TIMESTAMP
            //                        });
            //                        console.log("itemname" + itemsJSON[i].NAME);
            //                    }
            //                    // complete promise with a timer to simulate async response
            //                    setTimeout(function () {
            //                        resolve(listOfItems);
            //                    }, 1000);
            //                }
            //            });
            // Filling the hotels results manually just for demo purposes
            // console.log(listOfItems[0].NAME);
            //console.log(listOfItems[1].NAME);
            // listOfItems.push({
            //     name: 'KELLY SCUBA FIT & FLARE DRESS',
            //     image: 'http://productimages.drct2u.com/desktopzoom/products/gz/gz158/m01gz158500a.jpg',
            //     color: 'Black'
            // });
            // listOfItems.push({
            //     name: 'PLEATED PLEAT SKIRT MAXI DRESS',
            //     image: 'http://productimages.drct2u.com/main_product/products/ey/ey016/m01ey016500w.jpg',
            //     color: 'Red'
            // });
            // listOfItems.push({
            //     name: 'BELL SLEEVE LACE DRESS',
            //     image: 'https://static.wixstatic.com/media/679885_4a3b91e2caf34d09b111c757c3a716dd~mv2.jpg/v1/fill/w_498,h_748,al_c,q_90/file.jpg',
            //     color: 'Brown'
            // });
        });
    }, // searchHotelReviews: function (hotelName) {
    //     return new Promise(function (resolve) {
    //         // Filling the review results manually just for demo purposes
    //         var reviews = [];
    //         for (var i = 0; i < 5; i++) {
    //             reviews.push({
    //                 title: ReviewsOptions[Math.floor(Math.random() * ReviewsOptions.length)],
    //                 text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris odio magna, sodales vel ligula sit amet, vulputate vehicula velit. Nulla quis consectetur neque, sed commodo metus.',
    //                 image: 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif'
    //             });
    //         }
    //         // complete promise with a timer to simulate async response
    //         setTimeout(function () { resolve(reviews); }, 1000);
    //     });
    // }
};