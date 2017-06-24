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
            return /^https?:\/\/gitlab.com\/.+\/merge_requests\/.+$/.test(attachment.url);
        })
        .then(function(yellowstoneAttachments){
            yellowstoneAttachments.map(function(a){
                return Utils.getDataPromise(t, 'private', 'token')
                    .then(token => {
                        const path = Utils.getPathname(a.url);
                        const pathArray = path.split( '/' );
                        const url = Config.domain + "api/v4/projects/" +
                            encodeURIComponent(pathArray[1] + "/" + pathArray[2])
                            + "/merge_requests/" + pathArray[4] + "?access_token=" + token;

                        return fetch(url)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(json) {
                                let title = document.getElementById('title');
                                title.textContent = json.title;
                                title.setAttribute('href', a.url);
                                document.getElementById('repo').textContent = pathArray[1] + "/" + pathArray[2];
                                document.getElementById('number').textContent = "!" + json.iid;
                                document.getElementById('author').textContent = "opened by " + json.author.name;
                                document.getElementById('from').textContent = json.target_branch;
                                document.getElementById('destination').textContent = json.source_branch;
                            })
                    }).then(() => {
                        return t.sizeTo('#content');
                    });
            });
        })
});
