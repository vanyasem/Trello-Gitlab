/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;
const t = TrelloPowerUp.iframe();

// you can access arguments passed to your iframe like so
const arg = t.arg('arg');

t.render(function(){
    // make sure your rendering logic lives here, since we will
    // recall this method as the user adds and removes attachments
    // from your section
    t.card('attachments')
        .get('attachments')
        .filter(function(attachment){
            return /^https?:\/\/gitlab.com\/.+\/tree\/.+$/.test(attachment.url);
        })
        .then(function(yellowstoneAttachments){
            yellowstoneAttachments.map(function(a){
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        const path = Utils.getPathname(a.url);
                        const pathArray = path.split( '/' );
                        let branchName = "";
                        for(let i = 4; i < pathArray.length; i++) {
                            branchName += "/" + pathArray[i]
                        }
                        const url = Config.domain + "api/v4/projects/" +
                            encodeURIComponent(pathArray[1] + "/" + pathArray[2])
                            + "/repository/branches" + branchName + "?access_token=" + token;

                        return fetch(url)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(json) {
                                let title = document.getElementById('repo');
                                title.textContent = pathArray[1] + "/" + pathArray[2];
                                title.setAttribute('href', a.url);
                                document.getElementById('branch').textContent = json.name;
                                document.getElementById('message').textContent = json.commit.title;
                                document.getElementById('author').textContent = "by " + json.commit.author_name;
                            })
                    }).then(() => {
                        return t.sizeTo('#content');
                    });
            });
        })
});
