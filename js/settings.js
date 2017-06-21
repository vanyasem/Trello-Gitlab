/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;
const t = TrelloPowerUp.iframe();

let repoList = document.getElementById('repoList');

t.render(function(){
    return Utils.getDataPromise(t, 'shared', 'repos')
        .then(result => {
            if(result) {
                repoList.innerHTML = result["name"] +
                    "<a id=\"remove\" data-repo-id=" + result["id"] + ">Remove</a>";

                let remove = document.getElementById('remove');
                remove.addEventListener('click', function(){
                    remove.getAttribute("data");
                    t.set('organization', 'shared', 'repos', undefined);
                    t.set('board', 'shared', 'repos', undefined);
                })
            }
            else
                repoList.innerHTML = "No repos added";
        }).then(() => {
            t.sizeTo('#content')
                .done();
        })
});

document.getElementById('repoAdd').addEventListener('click', function(){
    return Utils.getDataPromise(t, 'private', 'token')
        .then(result => {
            if(!Utils.tokenLooksValid(result))
                return;

            const url = Config.domain + "api/v4/projects?owned=true&simple=true&access_token="+result;
            fetch(url)
                .then(function(response) {
                    return response.json();
                })
                .then(function(json) {
                    let literal = {};

                    for(let i = 0; i < json.length; i++) {
                        const obj = json[i];
                        literal[obj.id] = obj.name_with_namespace;
                    }

                    const items = Object.keys(literal).map(function(repoId){
                        return {
                            text: literal[repoId],
                            callback: function(t){
                                let promise = undefined;
                                promise = t.set('organization', 'shared', 'repos', { id: repoId, name: literal[repoId] })
                                    .catch(t.NotHandled, function() {
                                        // fall back to storing at board level
                                        promise= t.set('board', 'shared', 'repos', { id: repoId, name: literal[repoId] });
                                    });
                                promise.then(() => {
                                    return t.back();
                                })
                            }
                        };
                    });

                    t.popup({
                        title: 'Choose a repo...',
                        items: items
                    });
                });
        })
        .then(function(){
            t.sizeTo('#content')
                .done();
        });
});
