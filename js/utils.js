/**
 * Created by vanyasem on 6/20/17.
 */

const Utils = (function(){

    return {
        setDataPromise: function (t, visibility, name, value) {
            return t.set('organization', visibility, name, value)
                .catch(t.NotHandled, function() {
                    // fall back to storing at board level
                    return t.set('board', visibility, name, value);
                });
        },

        getDataPromise: function (t, visibility, name) {
            return new TrelloPowerUp.Promise((resolve) => {
                Promise.all([
                    t.get('organization', visibility, name),
                    t.get('board', visibility, name),
                ]).spread(function(organizationValue, boardValue){
                    if(organizationValue){
                        resolve(organizationValue)
                    }
                    if(boardValue){
                        resolve(boardValue)
                    }
                    resolve(undefined)
                });
            })
        },

        tokenLooksValid: function(token) {
            return /^[0-9a-f]{64}$/.test(token);
        },

        getPathname: function(href) {
            let l = document.createElement("a");
            l.href = href;
            return l.pathname;
        }
    }

}());