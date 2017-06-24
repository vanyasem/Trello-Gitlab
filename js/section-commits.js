/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;
const t = TrelloPowerUp.iframe();

t.render(function(){
    // make sure your rendering logic lives here, since we will
    // recall this method as the user adds and removes attachments
    // from your section
    t.card('attachments')
        .get('attachments')
        .filter(function(attachment){
            return /^https?:\/\/gitlab.com\/.+\/commit\/.+$/.test(attachment.url);
        })
        .then(function(yellowstoneAttachments){
            yellowstoneAttachments.map(function(a){
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        const path = Utils.getPathname(a.url);
                        const pathArray = path.split( '/' );
                        const url = Config.domain + "api/v4/projects/" +
                            encodeURIComponent(pathArray[1] + "/" + pathArray[2])
                            + "/repository/commits/" + pathArray[4] + "?access_token=" + token;

                        return fetch(url)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(json) {
                                let title = document.getElementById('title');
                                title.textContent = json.title;
                                title.setAttribute('href', a.url);
                                document.getElementById('message').textContent = json.message;
                                document.getElementById('user').textContent = "by " + json.author_name;
                            })
                    }).then(() => {
                        return t.sizeTo('#content');
                    });
            });
        })
});
