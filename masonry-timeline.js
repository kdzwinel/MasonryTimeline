/**
 * This plugin requires:
 * - packery.js
 * - moment.js
 * - jquery.js
 * - specific HTML structure:
 * <div>
 *      <div class="posts-container">
 *          <div class="posts">
 *              <div class="post" data-date="11.01.1980">
 *                  <!-- custom content -->
 *              </div>
 *              ...
 *          </div>
 *      </div>
 *      <div class="dates-container">
 *          <div class="dates"></div>
 *      </div>
 * </div>
 *
 */
(function ($, window, document, undefined) {
    "use strict";

    var pluginName = "masonryTimeline",
        defaults = {
            dateFormat: "DD.MM.YYYY",
            packery: {
                itemSelector: '.post',
                isHorizontal: true,
                gutter: 10,
                rowHeight: 100
            }
        };

    function MasonryTimeline(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    MasonryTimeline.prototype = {
        _postPositionCache: [],
        _postCountPerMonth: {},
        _maxPostsPerMonth: 0,

        init: function () {
            var that = this;
            var $posts = $(this.element).find('.posts .post');

            //wrap all dates with moment for easy manipulation
            $posts.each(function(idx, post) {
                var momentDate = moment($(post).data('date'), that.settings.dateFormat);
                $(post).data('date', momentDate);
            });

            //init packery
            $(this.element)
                .find('.posts')
                .packery(this.settings.packery);

            //store post positions for performance
            this._calculatePostCountPerMonth($posts);

            //draw the timeline
            this._drawTimeline($posts);
            this._updateTimeline();

            //whenever month is clicked -> scroll to right post
            $(this.element)
                .find('.dates')
                .on('click', '.months > *', function () {
                    that._jumpToDate($(this).data('date'));
                });

            //whenerver user scrolls list of posts -> update timeline
            $(this.element)
                .find('.posts-container')
                .scroll(this._updateTimeline.bind(this));

            //if window was resized -> redraw the timeline
            $(window).resize(function () {
                that._drawTimeline($posts);
                that._updateTimeline();
            })
        },
        //search for a first post with given month and year, scroll list of posts to that element
        _jumpToDate: function (date) {
            for (var i = 0; i < this._postPositionCache.length; i++) {
                var item = this._postPositionCache[i];

                if (item.date.year() === date.year() && item.date.month() === date.month()) {
                    $(this.element).find('.posts-container').scrollLeft(item.left);
                    break;
                }
            }
        },
        //calculate number of posts per month and maximum number of posts per month
        _calculatePostCountPerMonth: function ($posts) {
            this._postCountPerMonth = {};
            $posts.each(function (idx, post) {
                var date = $(post).data('date');
                var key = date.year() + '_' + date.month();

                this._postCountPerMonth[key] = this._postCountPerMonth[key] ? ++this._postCountPerMonth[key] : 1;
            }.bind(this));

            for (var key in this._postCountPerMonth) {
                var value = this._postCountPerMonth[key];

                if (value > this._maxPostsPerMonth) {
                    this._maxPostsPerMonth = value;
                }
            }
        },
        //cache post positions and width for better performance
        _updatePostPositionCache: function () {
            var that = this;
            $(this.element).find('.posts .post').each(function () {
                that._postPositionCache.push({
                    left: $(this).position().left,
                    width: $(this).width(),
                    date: $(this).data('date')
                });
            });

            this._postPositionCache.sort(function (a, b) {
                return (a.left > b.left) ? 1 : -1;
            });
        },
        //get information about posts that are currently visible in the post container
        _getVisiblePosts: function ($container) {
            var scrollLeft = $container.scrollLeft();
            var containerWidth = $container.parent().width();

            if (this._postPositionCache.length === 0) {
                this._updatePostPositionCache();
            }

            var visiblePosts = [];

            for (var i = 0; i < this._postPositionCache.length; i++) {
                var item = this._postPositionCache[i];

                if (item.left + (item.width / 2) < scrollLeft) {
                    continue;
                } else if (item.left + (item.width / 2) > scrollLeft + containerWidth) {
                    break;
                } else {
                    visiblePosts.push(item);
                }
            }

            return visiblePosts;
        },
        //highlight months that are currently visible
        _updateTimeline: function () {
            var visiblePosts = this._getVisiblePosts($(this.element).find('.posts-container'));

            $(this.element).find('.dates .months > li').removeClass('active');

            visiblePosts.forEach(function (post) {
                var date = post.date;

                $('#date_' + date.year() + '_' + date.month()).addClass('active');
            });
        },
        //create markup for the timeline
        _drawTimeline: function ($posts) {
            var years = [];
            var latestPostDate = $posts.eq(0).data('date');
            var lastPostDate = $posts.eq(-1).data('date');

            var startYear = latestPostDate.year();
            var endYear = lastPostDate.year();

            var months = (latestPostDate.month() + 1) + (startYear - endYear - 1) * 12 + (12 - lastPostDate.month());
            var monthWidth = Math.floor($(this.element).find('.dates').width() / months);

            var currentDate = latestPostDate.clone();
            var currentYear = startYear;

            var $year = $('<div class="year"><ul class="months"></ul><p>' + startYear + '</p></div>')

            for (var i = 0; i < months; i++) {
                var postsThisMonth = this._postCountPerMonth[currentYear + '_' + currentDate.month()];
                postsThisMonth = postsThisMonth ? postsThisMonth : 0;
                var monthHeight = Math.floor(postsThisMonth / this._maxPostsPerMonth * 100);

                var $month = $('<li></li>');
                $month.attr('id', 'date_' + currentYear + '_' + currentDate.month());
                $month.css('width', monthWidth + 'px');
                if (monthHeight > 0) {
                    $month.css('height', monthHeight + '%');
                } else {
                    $month.addClass('empty');
                }
                $month.data('date', currentDate.clone());
                $year.find('.months').append($month);

                currentDate.subtract('months', 1);

                if (currentDate.year() !== currentYear) {
                    years.push($year);
                    $year = $year.clone(true);
                    $year.find('ul').empty();
                    currentYear = currentDate.year();
                    $year.find('p').text(currentYear);
                }
            }

            if ($year.find('ul > li').length) {
                years.push($year);
            }

            $(this.element).find('.dates').empty().append(years);
        }
    };

    $.fn[ pluginName ] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new MasonryTimeline(this, options));
            }
        });
    };

})(jQuery, window, document);