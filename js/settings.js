/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var repoList = document.getElementById('repoList');

function getTokenPromise() {
  return new TrelloPowerUp.Promise((resolve) => {
    Promise.all([
      t.get('organization', 'private', 'token'),
      t.get('board', 'private', 'token'),
    ]).spread(function(organizationToken, boardToken){
      if(organizationToken && /^[0-9a-f]{64}$/.test(organizationToken)){
        resolve(organizationToken)
      }
      if(boardToken && /^[0-9a-f]{64}$/.test(boardToken)){
        resolve(boardToken)
      }
      resolve(undefined)
    });
  })
}

t.render(function(){
  return new TrelloPowerUp.Promise((resolve) => {
    Promise.all([
      t.get('organization', 'shared', 'repos'),
      t.get('board', 'shared', 'repos'),
    ]).spread(function(organizationRepos, boardRepos){
      if(organizationRepos){
        resolve(organizationRepos)
      }
      if(boardRepos){
        resolve(boardRepos)
      }
      resolve(undefined)
    });
  })
    .then(result => {
      if(result) {
        repoList.innerHTML = result["name"] +
          "<a id=\"remove\" data-repo-id=" + result["id"] + ">Remove</a>";

        var remove = document.getElementById('remove');
        remove.addEventListener('click', function(){
          remove.getAttribute("data");
          t.set('organization', 'shared', 'repos', undefined)
          t.set('board', 'shared', 'repos', undefined)
        })
      }
    else
      repoList.innerHTML = "No repos added";
    }).then(fun => {
      t.sizeTo('#content')
        .done();
    })
});

document.getElementById('repoAdd').addEventListener('click', function(){
  return getTokenPromise()
    .then(result => {
      //alert(result);
      var url = 'https://gitlab.com/api/v4/projects?owned=true&simple=true&access_token='+result;
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          var literal = {};

          for(var i = 0; i < json.length; i++) {
            var obj = json[i];
            literal[obj.id] = obj.name_with_namespace;
          }

          var items = Object.keys(literal).map(function(repoId){
            return {
              text: literal[repoId],
              callback: function(t){
                var promise = undefined;
                promise = t.set('organization', 'shared', 'repos', { id: repoId, name: literal[repoId] })
                  .catch(t.NotHandled, function() {
                    // fall back to storing at board level
                    promise= t.set('board', 'shared', 'repos', { id: repoId, name: literal[repoId] });
                  });
                promise.then(fun => {
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
