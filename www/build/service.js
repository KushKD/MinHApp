app.service('LoginService', function($q,$http,storeToken) { return {
        generateHash:function(param1,appConstants){
            var deferred=$q.defer();
            var promise=deferred.promise;
            var shaObj = new jsSHA("SHA-1", "TEXT");
                shaObj.setHMACKey(appConstants.apiKey, "TEXT");
                shaObj.update(param1);
            var hmac = shaObj.getHMAC("HEX");
              delete shaObj;
                deferred.resolve(hmac);
                  promise.success = function(fn) {
                      promise.then(fn);
                    return hmac;
                  }
                  promise.error = function(fn) {
                      promise.then(null, fn);
                    return promise;
                  }
              return promise;
        },
        generateIvestorHash:function(param1,appConstants){
            var deferred=$q.defer();
            var promise=deferred.promise;
            var shaObj = new jsSHA("SHA-1", "TEXT");
                shaObj.setHMACKey(appConstants.apiInvestorKey, "TEXT");
                shaObj.update(param1);
            var hmac = shaObj.getHMAC("HEX");
              delete shaObj;
                deferred.resolve(hmac);
                  promise.success = function(fn) {
                      promise.then(fn);
                    return hmac;
                  }
                  promise.error = function(fn) {
                      promise.then(null, fn);
                    return promise;
                  }
              return promise;
        },
        postHttpRequest:function(url,data){
          var deferred=$q.defer();
          var promise=deferred.promise;
          var request= $http({ method: 'POST', url: url, data: data })
            promise.success=function(fn) {
              promise.then(fn);
                return request;
            }
          return request;
        },
        getHttpRequest:function(url){
          var deferred=$q.defer();
          var promise=deferred.promise;
          var request= $http({ method: 'GET', url: url })
            promise.success=function(fn) {
              promise.then(fn);
                return request;
            }
          return request;
        },
    }
});


app.factory('storeToken', function($localstorage) {
  var token;
  return {
    setToken: function(currentToken) { token = currentToken; },
    getToken: function() {
      var userInfo = $localstorage.getObject('userInfo');
        if(userInfo.token)
          return userInfo.token;
        return false;
    },
  };
});

app.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) { $window.localStorage[key] = value; },
    get: function(key, defaultValue) { return $window.localStorage[key] || defaultValue; },
    setObject: function(key, value) { $window.localStorage[key] = JSON.stringify(value); },
    getObject: function(key) { return JSON.parse($window.localStorage[key] || '{}'); }
  }
}]);