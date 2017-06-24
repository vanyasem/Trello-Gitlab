/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;
const t = TrelloPowerUp.iframe();

let repoList = document.getElementById('repoList');

t.render(function(){
    return Utils.getDataPromise(t, "private", "comment", false)
        .then(comment => {
            checkbox.checked = comment;

            return Utils.getDataPromise(t, 'shared', 'repos')
                .then(result => {
                    if(result && result.length > 0) {
                        repoList.innerHTML = "";
                        for(let i = 0; i < result.length; i++) {
                            const par = document.createElement("p");
                            repoList.appendChild(par);

                            const name = document.createTextNode(result[i]["name"]);
                            par.appendChild(name);

                            let remove = document.createElement("a");
                            remove.setAttribute("data-repo", result[i]["id"]);
                            remove.setAttribute("style", "float: right;");
                            remove.text = "Remove";
                            par.appendChild(remove);

                            remove.onclick = function() {
                                const id = this.getAttribute("data-repo");
                                removeFromRepoList(id);
                            };
                        }
                    }
                    else {
                        repoList.innerHTML = "No repos added";
                    }
                }).then(() => {
                    t.sizeTo('#content')
                        .done();
                })
        })
});

function addToRepoList(repo) {
    return Utils.getDataPromise(t, 'shared', 'repos')
        .then(result => {
            if(result) {
                result.push(repo);
                Utils.setDataPromise(t, 'shared', 'repos', result)
            } else {
                Utils.setDataPromise(t, 'shared', 'repos', [repo])
            }
        })
}

function searchReposArray(idKey, array) {
    for (let i=0; i < array.length; i++) {
        if (array[i].id === idKey) {
            return i;
        }
    }
    return -1;
}

function removeFromRepoList(id) {
    return Utils.getDataPromise(t, 'shared', 'repos')
        .then(result => {
            const index = searchReposArray(id, result);
            if (index > -1) {
                result.splice(index, 1);
                Utils.setDataPromise(t, 'shared', 'repos', result);
            }
        })
}

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
                        literal[obj.id] = obj.path_with_namespace;
                    }

                    const items = Object.keys(literal).map(function(repoId){
                        return {
                            text: literal[repoId],
                            callback: function(t){
                                addToRepoList({ id: repoId, name: literal[repoId] })
                                    .then(() => {
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

let checkbox = document.getElementById("comment");
checkbox.onchange = function() {
    if(this.checked) {
        Utils.setDataPromise(t, "private", "comment", true);
    } else {
        Utils.setDataPromise(t, "private", "comment", false)
    }
};