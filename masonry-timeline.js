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
        _yearsCache: [],

        init: function () {
            var that = this;
            var $posts = $(this.element).find('.posts .post');

            //wrap all dates with moment for easy manipulation
            $posts.each(function (idx, post) {
                var momentDate = moment($(post).data('date'), that.settings.dateFormat);
                $(post).data('date', momentDate);
            });

            //init packery
            $(this.element)
                .find('.posts')
                .packery(this.settings.packery);

            //draw the timeline
            this._drawTimeline($posts);
            this._updateTimeline();

            //whenever month is clicked -> scroll to right post
            $(this.element)
                .find('.dates')
                .on('click', '.year', function () {
                    that._jumpToYear($(this).data('year'));
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
        //search for a first post with given year, scroll list of posts to that element
        _jumpToYear: function (year) {
            for (var i = 0; i < this._postPositionCache.length; i++) {
                var item = this._postPositionCache[i];

                if (item.date.year() === year) {
                    $(this.element).find('.posts-container').scrollLeft(item.left);
                    break;
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
            var visibleYears = visiblePosts.map(function(post) {
                return post.date.year();
            }).filter(function(elem, pos, self) {
                //keep only unique elements
                return self.indexOf(elem) == pos;
            });

            //highlight visible years
            this._yearsCache.forEach(function(yearElem){
                var year = yearElem.data('year');

                if(visibleYears.indexOf(year) !== -1) {
                    yearElem.addClass('active');
                } else {
                    yearElem.removeClass('active');
                }
            });
        },
        //create markup for the timeline
        _drawTimeline: function ($posts) {
            this._yearsCache = [];
            var latestPostDate = $posts.eq(0).data('date');
            var lastPostDate = $posts.eq(-1).data('date');

            var startYear = latestPostDate.year();
            var endYear = lastPostDate.year();

            var yearWidth = Math.floor($(this.element).find('.dates').width() / (startYear - endYear + 1));

            var $year = $('<div class="year"><p></p></div>');

            for (var i = startYear; i >= endYear; i--) {
                $year = $year.clone(true);
                $year.data('year', i);
                $year.attr('id', 'year_' + i);
                $year.find('p').text(i);
                $year.css('width', yearWidth + 'px');
                this._yearsCache.push($year);
            }

            $(this.element).find('.dates').empty().append(this._yearsCache);
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