/**
 * Created by vanyasem on 6/20/17.
 */

const Utils = (function(){

    return {
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
    }

}());