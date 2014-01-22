(function(){
    "use strict";

    function getRandomElement(arr) {
        return arr[Math.floor(arr.length * Math.random())];
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function randomPosts(count) {
        var $posts = [];
        var $post = $('<div/>');
        $post.addClass('post').append('<h1/>').append('<small/>').append('<p/>');
        var $newPost;
        var lastDate = moment();
        var sizeClasses = ['small', 'big', 'medium-wide', 'medium'];

        for (var i = 0; i < count; i++) {
            $newPost = $post.clone(true);

            $newPost.addClass(getRandomElement(sizeClasses));

            lastDate.subtract('days', getRandom(1,28));
            $newPost.attr('data-date', lastDate.format('DD.MM.YYYY'));

            $newPost.find('h1').text('Item #' + i);
            $newPost.find('small').text(lastDate.format('DD MMM YYYY'));
            $newPost.find('p').text(' Lorem ipsum dolor sit amet, consectetuer adipiscing elit.');

            $posts.push($newPost);
        }

        return $posts;
    }

    window.randomPosts = randomPosts;
})();