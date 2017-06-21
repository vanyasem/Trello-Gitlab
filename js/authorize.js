/* global TrelloPowerUp */

const Promise = TrelloPowerUp.Promise;
const t = TrelloPowerUp.iframe();

const oauthUrl = Config.domain + 'oauth/authorize?' +
    'client_id=' + Config.clientId +
    '&redirect_uri=' + Config.returnUrl +
    '&response_type=code' +
    '&state=state'; //todo random state

const authorizeOpts = {
    height: 680,
    width: 580,
    validToken: Utils.tokenLooksValid
};

document.getElementById('authorize')
    .addEventListener('click', function() {
    t.authorize(oauthUrl, authorizeOpts)
        .then(function(token) {
            return Utils.setDataPromise(t, 'private', 'token', token);
        })
        .then(function() {
            // todo prob open another pop-up
            return t.closePopup();
        });
});

document.getElementById('enterprise')
    .addEventListener('click', function() {
    return t.overlay({
        url: './php/auth_enterprise.php',
        args: { rand: (Math.random() * 100).toFixed(0) }
    });
});