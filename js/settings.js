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
  /*
  return Promise.all([
    t.get('board', 'shared', 'fruit'),
    t.get('board', 'private', 'vegetable')
  ])
  .spread(function(savedFruit, savedVegetable){
    if(savedFruit && /[a-z]+/.test(savedFruit)){
      fruitSelector.value = savedFruit;
    }
    if(savedVegetable && /[a-z]+/.test(savedVegetable)){
      vegetableSelector.value = savedVegetable;
    }
  })
  .then(function(){
    t.sizeTo('#content')
    .done();
  })*/
});

document.getElementById('repoAdd').addEventListener('click', function(){
  return getTokenPromise()
    .then(result => {
      //alert(result);
      var url = 'https://gitlab.com/api/v4/projects?owned=true&access_token='+result;
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
              url: urlForCode,
              callback: function(t){
                return t.closePopup();
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
