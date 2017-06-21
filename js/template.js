/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;

var WHITE_ICON = './images/icon-white.svg';
var GRAY_ICON = './images/icon-gray.svg';

var parkMap = {
    acad: 'Acadia National Park',
    arch: 'Arches National Park',
    badl: 'Badlands National Park',
    brca: 'Bryce Canyon National Park',
    crla: 'Crater Lake National Park',
    dena: 'Denali National Park',
    glac: 'Glacier National Park',
    grca: 'Grand Canyon National Park',
    grte: 'Grand Teton National Park',
    olym: 'Olympic National Park',
    yell: 'Yellowstone National Park',
    yose: 'Yosemite National Park',
    zion: 'Zion National Park'
};

var cardActions = {
    branches: 'Attach Branch',
    commit: 'Attach Commit',
    issues: 'Attach Issue',
    merge_requests: 'Attach Pull Request'
};

var getBadges = function(t){
    return t.card('name')
        .get('name')
        .then(function(cardName){
            var badgeColor;
            var icon = GRAY_ICON;
            var lowercaseName = cardName.toLowerCase();
            if(lowercaseName.indexOf('green') > -1){
                badgeColor = 'green';
                icon = WHITE_ICON;
            } else if(lowercaseName.indexOf('yellow') > -1){
                badgeColor = 'yellow';
                icon = WHITE_ICON;
            } else if(lowercaseName.indexOf('red') > -1){
                badgeColor = 'red';
                icon = WHITE_ICON;
            }

            if(lowercaseName.indexOf('dynamic') > -1){
                // dynamic badges can have their function rerun after a set number
                // of seconds defined by refresh. Minimum of 10 seconds.
                return [{
                    dynamic: function(){
                        return {
                            title: 'Detail Badge', // for detail badges only
                            text: 'Dynamic ' + (Math.random() * 100).toFixed(0).toString(),
                            icon: icon, // for card front badges only
                            color: badgeColor,
                            refresh: 10
                        }
                    }
                }]
            }

            if(lowercaseName.indexOf('static') > -1){
                // return an array of badge objects
                return [{
                    title: 'Detail Badge', // for detail badges only
                    text: 'Static',
                    icon: icon, // for card front badges only
                    color: badgeColor
                }];
            } else {
                return [];
            }
        })
};

var formatNPSUrl = function(t, url){
    if(!/^https?:\/\/www\.nps\.gov\/[a-z]{4}\//.test(url)){
        return null;
    }
    var parkShort = /^https?:\/\/www\.nps\.gov\/([a-z]{4})\//.exec(url)[1];
    if(parkShort && parkMap[parkShort]){
        return parkMap[parkShort];
    } else{
        return null;
    }
};

var formatGitLabUrl = function(t, url){
    if(!/^https?:\/\/gitlab\.com\//.test(url)){
        return undefined;
    }
    var parkShort = /^https?:\/\/www\.nps\.gov\/([a-z]{4})\//.exec(url)[1];
    if(parkShort && parkMap[parkShort]){
        return parkMap[parkShort];
    } else{
        return null;
    }
};

var cardButtonCallback = function(t){
    var items = Object.keys(cardActions).map(function(action){

        var urlForCode = 'https://gitlab.com' + action + '/';
        return {
            text: cardActions[action],
            url: urlForCode,
            callback: function(t){
                return t.attach({ url: urlForCode, name: cardActions[action] })
                    .then(function(){
                        return t.closePopup();
                    })
            }
        };
    });

    return t.popup({
        title: 'GitLab',
        items: items
    });
};

TrelloPowerUp.initialize({
    'attachment-sections': function(t, options){
        // options.entries is a list of the attachments for this card
        // you can look through them and 'claim' any that you want to
        // include in your section.

        // we will just claim urls for Yellowstone
        var claimed = options.entries.filter(function(attachment){
            return attachment.url.indexOf('http://www.nps.gov/yell/') == 0;
        });

        // you can have more than one attachment section on a card
        // you can group items together into one section, have a section
        // per attachment, or anything in between.
        if(claimed && claimed.length > 0){
            // if the title for your section requires a network call or other
            // potentially length operation you can provide a function for the title
            // that returns the section title. If you do so, provide a unique id for
            // your section
            return [{
                id: 'Yellowstone', // optional if you aren't using a function for the title
                claimed: claimed,
                icon: GRAY_ICON,
                title: 'Example Attachment Section: Yellowstone',
                content: {
                    type: 'iframe',
                    url: t.signUrl('./section.html', { arg: 'you can pass your section args here' }),
                    height: 230
                }
            }];
        } else {
            return [];
        }
    },
    'attachment-thumbnail': function(t, options){
        var parkName = formatNPSUrl(t, options.url);
        if(parkName){
            // return an object with some or all of these properties:
            // url, title, image, openText, modified (Date), created (Date), createdBy, modifiedBy
            return {
                url: options.url,
                title: parkName,
                image: {
                    url: './images/nps.svg',
                    logo: true // false if you are using a thumbnail of the content
                },
                openText: 'Open in NPS'
            };
        } else {
            throw t.NotHandled();
        }
    },
    'card-badges': function(t, options){
        return getBadges(t);
    },
    'card-buttons': function(t, options) {
        return [{
            icon: GRAY_ICON,
            text: 'GitLab',
            callback: cardButtonCallback
        }];
    },
    'card-detail-badges': function(t, options) {
        return getBadges(t);
    },
    'format-url': function(t, options) {
        var parkName = formatNPSUrl(t, options.url);
        if(parkName){
            return {
                icon: GRAY_ICON,
                text: parkName
            };
        } else {
            throw t.NotHandled();
        }
    },
    'show-settings': function(t, options){
        return t.popup({
            title: 'Settings',
            url: './settings.html',
            height: 184
        });
    },
    'authorization-status': function(t) {
        return new TrelloPowerUp.Promise((resolve) => {
            Promise.all([
                t.get('organization', 'private', 'token'),
                t.get('board', 'private', 'token'),
            ]).spread(function(organizationToken, boardToken){
                if((organizationToken && /^[0-9a-f]{64}$/.test(organizationToken))
                    || (boardToken && /^[0-9a-f]{64}$/.test(boardToken))){
                    resolve({ authorized: true })
                }
                resolve({ authorized: false })
            });
        })
    },
    'show-authorization': function(t) {
        t.popup({
            title: 'Authorize',
            url: './authorize.html',
            height: 150
        });
    }
});
