var Promise = require('bluebird');

var ReviewsOptions = [
    '“Very stylish, great stay, great staff”',
    '“good hotel awful meals”',
    '“Need more attention to little things”',
    '“Lovely small hotel ideally situated to explore the area.”',
    '“Positive surprise”',
    '“Beautiful suite and resort”'];

module.exports = {
    findItems: function (items,date) {
        return new Promise(function (resolve) {

            // Filling the hotels results manually just for demo purposes
            var listOfItems = [];
            
                listOfItems.push({
                    name: 'KELLY SCUBA FIT & FLARE DRESS',
                    image: 'http://productimages.drct2u.com/desktopzoom/products/gz/gz158/m01gz158500a.jpg',
                    color: 'Black'
                });
                listOfItems.push({
                    name: 'PLEATED PLEAT SKIRT MAXI DRESS',
                    image: 'http://productimages.drct2u.com/main_product/products/ey/ey016/m01ey016500w.jpg',
                    color: 'Red'
                });
                listOfItems.push({
                    name: 'BELL SLEEVE LACE DRESS',
                    image: 'https://static.wixstatic.com/media/679885_4a3b91e2caf34d09b111c757c3a716dd~mv2.jpg/v1/fill/w_498,h_748,al_c,q_90/file.jpg',
                    color: 'Brown'
                });
           
            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(listOfItems); }, 1000);
        });
    },

    // searchHotelReviews: function (hotelName) {
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