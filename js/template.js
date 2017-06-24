/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;

const WHITE_ICON = './images/icon-white.svg';
const GRAY_ICON = './images/icon-gray.svg';

const parkMap = {
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

const cardActions = {
    tree: 'Attach Branch',
    commit: 'Attach Commit',
    issues: 'Attach Issue',
    merge_requests: 'Attach Merge Request'
};

const boardButtonCallback = function(t){
    return Utils.getDataPromise(t, "shared", "repos").then(result => {

        const items = Object.keys(result).map(function(repoId){
            return {
                text: result[repoId].name,
                icon: GRAY_ICON,
                url: Config.domain + result[repoId].name
            };
        });

        return t.popup({
            title: 'Repos',
            items: items
        });
    });
};

const getBadges = function(t){
    return t.card('name')
        .get('name')
        .then(function(cardName){
            let badgeColor;
            let icon = GRAY_ICON;
            let lowercaseName = cardName.toLowerCase();
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

const formatNPSUrl = function(t, url){
    if(!/^https?:\/\/www\.nps\.gov\/[a-z]{4}\//.test(url)){
        return null;
    }
    const parkShort = /^https?:\/\/www\.nps\.gov\/([a-z]{4})\//.exec(url)[1];
    if(parkShort && parkMap[parkShort]){
        return parkMap[parkShort];
    } else{
        return null;
    }
};

const formatGitLabUrl = function(t, url){
    if(!/^https?:\/\/gitlab\.com\//.test(url)){
        return undefined;
    }
    const parkShort = /^https?:\/\/www\.nps\.gov\/([a-z]{4})\//.exec(url)[1];
    if(parkShort && parkMap[parkShort]){
        return parkMap[parkShort];
    } else{
        return null;
    }
};


function processBranches(urlForCode, json, projectId) {
    let branches = {};

    for(let i = 0; i < json.length; i++) {
        const obj = json[i];
        branches[obj.name] = obj.name;
    }

    return Object.keys(branches).map(function(name){
        return {
            text: branches[name],
            callback: function(t){
                return t.attach({ url: urlForCode + name, name: branches[name] })
                    .then(function(){
                        return t.closePopup();
                    });
            }
        };

    });
}

function processCommits(urlForCode, json, projectId) {
    let commits = {};

    for(let i = 0; i < json.length; i++) {
        const obj = json[i];
        commits[obj.id] = obj.title;
    }

    return Object.keys(commits).map(function(id){
        return {
            text: commits[id],
            callback: function(t){
                return t.attach({ url: urlForCode + id, name: commits[id] })
                    .then(function(){
                        commentCommit(t, projectId, id)
                            .then(() => {
                            return t.closePopup();
                            })
                    });
            }
        };

    });
}

function processIssues(urlForCode, json, projectId) {
    let issues = {};

    for(let i = 0; i < json.length; i++) {
        const obj = json[i];
        issues[obj.iid] = obj.title;
    }

    return Object.keys(issues).map(function(iid){
        return {
            text: issues[iid],
            callback: function(t){
                return t.attach({ url: urlForCode + iid, name: issues[iid] })
                    .then(function(){
                        commentIssue(t, projectId, iid)
                            .then(() => {
                            return t.closePopup();
                        })
                    });
            }
        };

    });
}

function processMrs(urlForCode, json, projectId) {
    let mrs = {};

    for(let i = 0; i < json.length; i++) {
        const obj = json[i];
        mrs[obj.iid] = obj.title;
    }

    return Object.keys(mrs).map(function(iid){
        return {
            text: mrs[iid],
            callback: function(t){
                return t.attach({ url: urlForCode + iid, name: mrs[iid] })
                    .then(function(){
                        commentMr(t, projectId, iid)
                            .then(() => {
                            return t.closePopup();
                        })
                    });
            }
        };

    });
}

function commentIssue(t, projectId, iid) {
    return Utils.getDataPromise(t, "private", "comment", false)
        .then(comment => {
            if(comment) {
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        t.card('name', 'url')
                            .then(card => {
                                const url = Config.domain + "api/v4/projects/" + projectId + "/issues/" + iid + "/notes";
                                let body = new FormData();
                                body.append('body', makeCommentBody(card.name, card.url));
                                body.append('access_token', token);
                                return fetch(url, {
                                    method: 'POST',
                                    body: body
                                })
                            })
                    })
            }
        })
}

function commentMr(t, projectId, iid) {
    return Utils.getDataPromise(t, "private", "comment", false)
        .then(comment => {
            if(comment) {
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        t.card('name', 'url')
                            .then(card => {
                                const url = Config.domain + "api/v4/projects/" + projectId + "/merge_requests/" + iid + "/notes";
                                let body = new FormData();
                                body.append('body', makeCommentBody(card.name, card.url));
                                body.append('access_token', token);
                                return fetch(url, {
                                    method: 'POST',
                                    body: body
                                })
                            })
                    })
            }
        })
}

function commentCommit(t, projectId, sha) {
    return Utils.getDataPromise(t, "private", "comment", false)
        .then(comment => {
            if(comment) {
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        t.card('name', 'url')
                            .then(card => {
                                const url = Config.domain + "api/v4/projects/" + projectId + "/repository/commits/" + sha + "/comments";
                                let body = new FormData();
                                body.append('note', makeCommentBody(card.name, card.url));
                                body.append('access_token', token);
                                return fetch(url, {
                                    method: 'POST',
                                    body: body
                                })
                            })
                    })
            }
        })
}

function makeCommentBody(name, url) {
    return "![](https://github.trello.services/images/mini-trello-icon.png) [" + name + "](" + url + ")";
}

const cardButtonCallback = function(t){
    const actions = Object.keys(cardActions).map(function(action){

        return {
            text: cardActions[action],
            callback: function(t){
                return Utils.getDataPromise(t, "shared", "repos").then(result => {

                    const repos = Object.keys(result).map(function(repoId){
                        const urlForCode = Config.domain + result[repoId].name + '/' + action + '/';
                        return {
                            text: result[repoId].name,
                            callback: function (t) {
                                return Utils.getDataPromise(t, 'private', 'token')
                                    .then(token => {
                                        let url = Config.domain;
                                        switch (action) {
                                            case "tree":
                                                url += "api/v4/projects/" + result[repoId].id + "/repository/branches?access_token=" + token;
                                                break;
                                            case "commit":
                                                url += "api/v4/projects/" + result[repoId].id + "/repository/commits?access_token=" + token;
                                                break;
                                            case "issues":
                                                url += "api/v4/projects/" + result[repoId].id + "/issues?access_token=" + token;
                                                break;
                                            case "merge_requests":
                                                url += "api/v4/projects/" + result[repoId].id + "/merge_requests?access_token=" + token;
                                                break;
                                            default:
                                                alert("Error!");
                                                return;
                                        }

                                        return fetch(url)
                                            .then(function(response) {
                                                return response.json();
                                            })
                                            .then(function(json) {
                                                let items;
                                                switch (action) {
                                                    case "tree":
                                                        items = processBranches(urlForCode, json, result[repoId].id);
                                                        break;
                                                    case "commit":
                                                        items = processCommits(urlForCode, json, result[repoId].id);
                                                        break;
                                                    case "issues":
                                                        items = processIssues(urlForCode, json, result[repoId].id);
                                                        break;
                                                    case "merge_requests":
                                                        items = processMrs(urlForCode, json, result[repoId].id);
                                                        break;
                                                    default:
                                                        alert("Error!");
                                                        return;
                                                }

                                                return t.popup({
                                                    title: cardActions[action],
                                                    items: items
                                                });
                                            });
                                    })
                            }
                        };
                    });

                    return t.popup({
                        title: 'Choose Repo',
                        items: repos
                    });
                });
            }
        };
    });

    return t.popup({
        title: 'GitLab',
        items: actions
    });
};

TrelloPowerUp.initialize({
    'attachment-sections': function(t, options){
        // options.entries is a list of the attachments for this card
        // you can look through them and 'claim' any that you want to
        // include in your section.

        const commits = options.entries.filter(function(attachment) {
            return /^https?:\/\/gitlab.com\/.+\/commit\/.+$/.exec(attachment.url);
        });

        const issues = options.entries.filter(function(attachment) {
            return /^https?:\/\/gitlab.com\/.+\/issues\/.+$/.exec(attachment.url);
        });

        const mrs = options.entries.filter(function(attachment) {
            return /^https?:\/\/gitlab.com\/.+\/merge_requests\/.+$/.exec(attachment.url);
        });

        const branches = options.entries.filter(function(attachment) {
            return /^https?:\/\/gitlab.com\/.+\/tree\/.+$/.exec(attachment.url);
        });

        // you can have more than one attachment section on a card
        // you can group items together into one section, have a section
        // per attachment, or anything in between.
        return [
            {
                claimed: mrs,
                icon: GRAY_ICON,
                title: 'GitLab Merge Requests',
                content: {
                    type: 'iframe',
                    url: t.signUrl('./section-mrs.html'),
                    height: 230
                }
            },
            /*{
                claimed: issues,
                icon: GRAY_ICON,
                title: 'GitLab Issues',
                content: {
                    type: 'iframe',
                    url: t.signUrl('./section-issues.html', { arg: 'you can pass your section args here' }),
                    height: 230
                }
            },*/
            {
                claimed: commits,
                icon: GRAY_ICON,
                title: 'GitLab Commits',
                content: {
                    type: 'iframe',
                    url: t.signUrl('./section-commits.html'),
                    height: 230
                }
            },
            {
                claimed: branches,
                icon: GRAY_ICON,
                title: 'GitLab Branches',
                content: {
                    type: 'iframe',
                    url: t.signUrl('./section-branches.html'),
                    height: 230
                }
            }
        ];
    },
    'attachment-thumbnail': function(t, options){
        const parkName = formatNPSUrl(t, options.url);
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
    'board-buttons': function(t, options){
        return [{
            icon: WHITE_ICON,
            text: 'Repos',
            callback: boardButtonCallback
        }];
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
        const parkName = formatNPSUrl(t, options.url);
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
            Utils.getDataPromise(t, 'private', 'token')
                .then(result => {
                    if (result && Utils.tokenLooksValid(result)) {
                        resolve({authorized: true});
                    }
                    resolve({authorized: false});
                });
        });
    },
    'show-authorization': function(t) {
        t.popup({
            title: 'Authorize',
            url: './authorize.html',
            height: 150
        });
    }
});
