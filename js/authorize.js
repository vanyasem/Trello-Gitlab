/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var oauthUrl = 'https://gitlab.com/oauth/authorize?' +
    'client_id=3cc11740e0ec6eb908cb18bb43d6a8f66efb90d8505bb5d7d683402c173fdd96' +
    '&redirect_uri=https://peacedoorball.ru/trello/php/get_token.php' +
    '&response_type=code' +
    '&state=state'; //todo random state

var tokenLooksValid = function(token) {
    return /^[0-9a-f]{64}$/.test(token);
}

var authorizeOpts = {
    height: 680,
    width: 580,
    validToken: tokenLooksValid
};

var authBtn = document.getElementById('authorize');
authBtn.addEventListener('click', function() {
    t.authorize(oauthUrl, authorizeOpts)
        .then(function(token) {
            return t.set('organization', 'private', 'token', token)
                .catch(t.NotHandled, function() {
                    // fall back to storing at board level
                    return t.set('board', 'private', 'token', token);
                });
        })
        .then(function() {
          // todo prob open another pop-up
            return t.closePopup();
        });
});