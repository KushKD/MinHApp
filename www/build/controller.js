app.controller('AppController', function($interval,$cordovaToast,$ionicPlatform, $state, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory,$cordovaInAppBrowser) {
    var countTimerForCloseApp = false;
    $ionicPlatform.registerBackButtonAction(function(e) {
      e.preventDefault();
      function showConfirm() {
        if (countTimerForCloseApp) {
         ionic.Platform.exitApp();
        }
        else{
         countTimerForCloseApp = true;
         $cordovaToast
         .show('Tap again to exit app', 'long', 'bottom')
         $timeout(function() {
          countTimerForCloseApp = false;
         }, 4000);
        }
      };

      if ($ionicHistory.backView()) {
        $ionicHistory.backView().go();
      }
      else{
        showConfirm();
      }
      return false;
    }, 101);

    var userInfo = $localstorage.getObject('userInfo');  
    $scope.userInfo = userInfo;
    $scope.data = {};
    
    $ionicModal.fromTemplateUrl('templates/modals/userInfo.html', {
      scope: $scope,
      animation: 'animated slideInLeft'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.openUserInfo=function(){
      $scope.modal.show();
    }
    
    $scope.closeModal = function() {
      $scope.modal.hide();
      $scope.modalcon.hide();
    };

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
      $scope.modalcon.remove();
    });

    $scope.getDate=function(date){
      return new Date(date);
    }

    var options = { location: 'yes',clearcache: 'yes',toolbar: 'no'};
    $scope.openBrowser = function() {
      $cordovaInAppBrowser.open(appConstants.WebsiteUrl, '_blank', options)
      .then(function(event) {
         // success
      })
      .catch(function(event) {
         // error
      });
    }

    var SaveOneSinglePlayerId = function(){
        window.plugins.OneSignal.getIds(function(ids){
            var userInfo = $localstorage.getObject('userInfo'); 
            var player_id = ids.userId;
            if(!angular.isUndefined(userInfo.token) && !angular.isUndefined(userInfo.user_id)){
                $scope.apiHash = "";
                var apiHash = LoginService.generateHash(player_id+userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
                var postData = {"source":"M","api_hash":apiHash,"player_id":player_id,"user_id":userInfo.user_id, "token":userInfo.token};
                var url = appConstants.apiUrl+'savePlayerId';
                LoginService.postHttpRequest(url,postData).success(function(postResponse){
                  if(postResponse.STATUS != 200){
                    console.log(postResponse.RESPONSE);
                  }
                  if(postResponse.STATUS == 200){
                    console.log(postResponse.RESPONSE);
                  }
                })
            }
        });
    }
    $interval(function(){SaveOneSinglePlayerId()},10000);

    $ionicModal.fromTemplateUrl('templates/modals/users.html', {
      scope: $scope,
      animation: 'animated slideInDown'
    }).then(function(modal) {
      $scope.modalcon = modal;
    });

    $scope.GetContactDetail = function(){
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner><br>Fetching Contacts<br>Please Wait !',
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 0
      });
      var postData = {"source":"M",};
      var url = appConstants.apiUrl+'getContactDetail';
      LoginService.postHttpRequest(url,postData).success(function(postResponse){
        if(postResponse.STATUS != 200){
          $ionicLoading.hide();
        }
        if(postResponse.STATUS == 200){
          $ionicLoading.hide();
          $scope.input = {};
          $scope.groups=postResponse.DATA;
          $scope.modalcon.show();
        }
      })
    }
    $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      }
      else{
        $scope.shownGroup = group;
      }
    };
    $scope.isGroupShown = function(group) {
      return $scope.shownGroup === group;
    };
    ////DEPARTMENT LOGIN////
    $scope.loginDepartment = function(formData) {
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Please Wait,<br> logging you in.'});
      if(angular.isUndefined(formData.username) || formData.username == ""){
        $ionicLoading.hide(); 
        var alertPopup = $ionicPopup.alert({title: 'ERROR !',template: 'Please Enter Username.'});
            alertPopup.then(function(res){console.log('Thank you for enter username.')});
        return false;
      }
      else if(angular.isUndefined(formData.password) || formData.password == ""){
        $ionicLoading.hide(); 
        var alertPopup = $ionicPopup.alert({title: 'ERROR !',template: 'Please Enter Password.'});
            alertPopup.then(function(res){console.log('Thank you for enter password.')});
        return false;
      }
      else{
        var userInfo = $localstorage.getObject('userInfo');
        if(userInfo.token){  
          $ionicViewSwitcher.nextDirection('back');
          $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
          });
          $state.go('app.Depdasboard', {}, {reload: true});
        }
        /*GET THE HASH FOR THE API*/
        $scope.apiHash='';
        var apiHash = LoginService.generateHash(formData.username,appConstants).success(function(hash){ return hash; })
        var postData = {"source":"M", "api_hash":apiHash,
                        "username":formData.username, "password":formData.password};
        var url = appConstants.apiUrl+'loginUser';
        LoginService.postHttpRequest(url,postData).success(function(postResponse){
          if(postResponse.STATUS!=200){
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                                                  title: 'ERROR ::'+ postResponse.STATUS,
                                                  template: postResponse.MSG,
                                                  okText: '&nbsp;',
                                                  okType: 'button-assertive icon ion-sad-outline',
                                                });
                  // alertPopup.then(function(res){console.log(postResponse.MSG)});
          }
          if(postResponse.STATUS==200){
            var url = appConstants.apiUrl+'gettokeninfo/token/'+postResponse.TOKEN;
            LoginService.getHttpRequest(url).success(function(inFoResponse){
              $localstorage.setObject('userInfo', {
                 token: inFoResponse.RESPONSE.token,
                 email: inFoResponse.RESPONSE.email,
                 user_id: inFoResponse.RESPONSE.user_id,
                 full_name: inFoResponse.RESPONSE.full_name,
                 role_id :inFoResponse.RESPONSE.role_id,
                 mobile_number  : inFoResponse.RESPONSE.mobile_number,
              });
              $ionicLoading.hide();
              $ionicViewSwitcher.nextDirection('back');
              $ionicHistory.nextViewOptions({
                disableBack: true,
                disableAnimate : true,
                historyRoot  : true
              });
              $ionicHistory.clearCache();
              $ionicHistory.clearHistory();
              $state.go('app.Depdasboard',{},{reload:true});
            }) 
          }
        })
      }
    }

    ////INVESTOR LOGIN////    
    $scope.loginInvestor = function(formData) {
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Please Wait,<br> logging you in.'});
      if(angular.isUndefined(formData.username) || formData.username == ""){
        $ionicLoading.hide(); 
        var alertPopup = $ionicPopup.alert({title: 'Please Enter Username.'});
        return false;
      }
      else if(angular.isUndefined(formData.password) || formData.password == ""){
        $ionicLoading.hide(); 
        var alertPopup = $ionicPopup.alert({title: 'Please Enter Password.'});
        return false;
      }
      else{
        var userInfo = $localstorage.getObject('userInfo');
        if(userInfo.token){
          $ionicViewSwitcher.nextDirection('back');
          $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
          });
          $state.go('app.invDashboard', {}, {reload: true}); 
        }
        /*GET THE HASH FOR THE API*/
        $scope.apiHash='';
        var apiHash = LoginService.generateIvestorHash(formData.username,appConstants).success(function(hash){ return hash; })
        var postData = {
                        "source":"M", "api_hash":apiHash,
                        "username":formData.username, "password":formData.password, 
                        "callback_url":"#", 
                        "callback_failure_url":"#",
                        "callback_success_url":"#"
                       };
        var url = appConstants.apiInvestorUrl+'secureLogin';
        LoginService.postHttpRequest(url,postData).success(function(postResponse){
          if(postResponse.STATUS!=200){
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                                                  title: postResponse.MSG,
                                                  okText: '&nbsp;',
                                                  okType: 'button-assertive icon ion-sad-outline',
                                                });
                  alertPopup.then(function(res){console.log(postResponse.MSG)});
          }
          if(postResponse.STATUS==200){
            LoginService.getHttpRequest(postResponse.RESPONSE.href).success(function(inFoResponse){
              $localstorage.setObject('userInfo', {
                token: inFoResponse.RESPONSE.token,
                email: inFoResponse.RESPONSE.email,
                iuid: inFoResponse.RESPONSE.iuid,
                user_id: inFoResponse.RESPONSE.user_id,
                full_name: inFoResponse.RESPONSE.first_name +" "+ inFoResponse.RESPONSE.last_name,
                role_id: 0,
                mobile_number: inFoResponse.RESPONSE.mobile_number,
              });
              $ionicLoading.hide();
              $ionicViewSwitcher.nextDirection('back');
              $ionicHistory.nextViewOptions({
                disableBack: true,
                disableAnimate : true,
                historyRoot  : true
              });
              $ionicHistory.clearCache();
              $ionicHistory.clearHistory();
              $state.go('app.invDashboard', {}, {reload: true});
            })
          }
        })
      }
    }

    ////LOGOUT////
    $scope.logout = function() {
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-assertive"></ion-spinner><br>Please Wait,<br> logging you out...'});
      $localstorage.setObject('userInfo','');
      $scope.modal.hide();
      $timeout(function () {
          $ionicViewSwitcher.nextDirection('back');
          $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
          });
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
          $ionicLoading.hide();
          $state.go('app.landing',{},{reload:true});
      }, 1000);
    }
})

app.controller('HomeController', function($state, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory,  $ionicPopup) {
    var userInfo = $localstorage.getObject('userInfo');
    
    if(angular.isUndefined(userInfo.token)){
      console.log("UserInfo Data Not Saved in Local Storage");
      goHome();
    }else{
      console.log( userInfo);
    }
   
       
    $scope.items = {
                      color: "#E47500",
                      icon: "ion-document",
                      title: "Get M-Form Detail",
                      code: "mform"
                    };
    $scope.openItem = function(item){
      $state.go('app.item', { title: item.title, icon: item.icon, color: item.color, code: item.code });
    };
    $scope.GoToLogin=function(term){
      var userInfo = $localstorage.getObject('userInfo');
      if(userInfo.token){
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
        });
        $state.go('app.invDashboard', {}, {reload: true}); 
      }
      if(term=="inv")
        $state.go('app.investorLogin');
      else
        $state.go('app.departmentLogin');
    }

    // MAIN FUNCTION TO GET DASHBOAD DATA
    $scope.GetDashboardData = function(){
      var postData = {"source":"M",};  //M for Mobile
      var url = appConstants.apiUrl+'GetMainPageData';
      LoginService.postHttpRequest(url,postData).success(function(postResponse){
        if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          // var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
          //     alertPopup.then(function(res){console.log(postResponse.MSG)});
          // $scope.PageData="false";
        }
        if(postResponse.STATUS == 200){
          $ionicLoading.hide();
          $scope.PageData=postResponse.RESPONSE;
        }
      })
    }
    
    $scope.getDate=function(date){
        return new Date(date);
    }
    $scope.data.currentPage = 0;
    var setupSlider = function() {
      $scope.data.sliderOptions = {
        initialSlide: 0,
        direction: 'vertical', //or vertical
        speed: 1000, //0.3s transition
        autoplay: 2000,
        loop:true
      };

      $scope.data.sliderDelegate = null;
      $scope.$watch('data.sliderDelegate', function(newVal, oldVal) {
        if (newVal != null) {
          $scope.data.sliderDelegate.on('slideChangeEnd', function() {
            $scope.data.currentPage = $scope.data.sliderDelegate.activeIndex;
            $scope.$apply();
          });
        }
      });

      $scope.data.NewsOptions = {
        initialSlide: 0,
        direction: 'horizontal', //or vertical
        speed: 1000, //0.3s transition
        autoplay: 2000,
        loop:true
      };

      $scope.data.sliderDelegate = null;
      $scope.$watch('data.sliderDelegate', function(newVal, oldVal) {
        if (newVal != null) {
          $scope.data.sliderDelegate.on('slideChangeEnd', function() {
            $scope.data.currentPage = $scope.data.sliderDelegate.activeIndex;
            $scope.$apply();
          });
        }
      });
    };
    setupSlider();
    function goHome(){
      $ionicViewSwitcher.nextDirection('back');  //available options are forward, back, enter, exit, swap
        $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
        });
        $state.go('app.landing');
    }
})

// ========================================================================================================================================================================================================//
// ========================================================================================================================================================================================================//
// ========================================================================================================================================================================================================//
// ========================================================================================================================================================================================================//

app.controller('DeptController', function($state,$scope,$location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $ionicViewSwitcher, $ionicHistory) {        
  var userInfo = $localstorage.getObject('userInfo');  
  $scope.userInfo = userInfo;
  // console.log(userInfo.role_id);
  // console.log("DEPT"+$scope.userInfo);
  if(angular.isUndefined(userInfo.token))
      goHome();


  if(userInfo.role_id == 8 ){
    $scope.items =[{
                    color: "#E47500",
                    icon: "ion-document",
                    title: "Get M-Form Detail",
                    code: "mform"
                  },{
                    color: "#D86B67",
                    icon: "ion-android-textsms",
                    title: "USSD",
                    code: "ussd"
                  },{
                    color: "#F8E548",
                    icon: "ion-location",
                    title: "Upload Location",
                    code: "loc"
                  },{
                    color: "#3DBEC9",
                    icon: "ion-folder",
                    title: "Upload Documents",
                    code: "doc"
                  },{
                    color: "#AD5CE9",
                    icon: "ion-navigate",
                    title: "Uploaded Location",
                    code: "officers_loc"
                  },{
                    color: "#5AD863",
                    icon: "ion-folder",
                    title: "Uploaded Documents",
                    code: "doc_comment"
                  },{
                    color: "#D86B67",
                    icon: "ion-android-call",
                    title: "Helpline",
                    code: "helpline"
                  },{
                    color: "#E47500",
                    icon: "ion-paper-airplane",
                    title: "Send Query",
                    code: "mail"
                  }];
  }
  else if(userInfo.role_id == 4 ){
    $scope.items =[{
                    color: "#E47500",
                    icon: "ion-document",
                    title: "Get M-Form Detail",
                    code: "mform"
                  },{
                    color: "#D86B67",
                    icon: "ion-android-textsms",
                    title: "USSD",
                    code: "ussd"
                  },{
                    color: "#F8E548",
                    icon: "ion-navigate",
                    title: "Officer Location",
                    code: "officers_loc"
                  },{
                    color: "#3DBEC9",
                    icon: "ion-folder",
                    title: "Documents",
                    code: "doc_comment"
                  },{
                    color: "#AD5CE9",
                    icon: "ion-android-call",
                    title: "Helpline",
                    code: "helpline"
                  },{
                    color: "#5AD863",
                    icon: "ion-paper-airplane",
                    title: "Send Query",
                    code: "mail"
                  }];
  }
  else{
    goHome();
  }
  
  $scope.openItem = function(item){
    $state.go('app.item', { title: item.title, icon: item.icon, color: item.color, code: item.code });
  };
  function goHome(){
    $ionicViewSwitcher.nextDirection('back');
      $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
      });
      $state.go('app.landing');
  }
})

app.controller('ItemController', function($state, $cordovaEmailComposer, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory) {
    var userInfo = $localstorage.getObject('userInfo');
    $scope.item = { title: $stateParams.title,icon: $stateParams.icon,color: $stateParams.color,code: $stateParams.code };
    // ==================M-FORM DETAIL=================== //
    $scope.getDetail = function(){
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner><br>Fetching M-Form Detail<br>Please Wait !',
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 0
      });
      if(checkNumber()){
        var userInfo = $localstorage.getObject('userInfo');
        $scope.apiHash = "";
        var apiHash = LoginService.generateHash($scope.data.mformnumber,appConstants).success(function(hash){ return hash; })
        var postData = {"source":"M", "api_hash":apiHash, "mFormNumber":$scope.data.mformnumber};
        var url = appConstants.apiUrl+'getMformDetail';
        LoginService.postHttpRequest(url,postData).success(function(postResponse){
          if(postResponse.STATUS != 200){
              $ionicLoading.hide();
              $scope.data.mformnumber="";
              $scope.FormData = "";
              var alertPopup = $ionicPopup.alert({title: 'Msg :: '+postResponse.STATUS ,template: postResponse.RESPONSE});
          }
          if(postResponse.STATUS == 200){
            $scope.FormData = postResponse.DATA;
            $ionicLoading.hide();
          }
        })
      }
      function checkNumber(){
        // var inputString = $scope.data.mformnumber;
        // re = /[`~!@#$%^&*()_|+\-=?;:'", .<>\{\}\[\]\\\/]/gi;
        // var isSplChar = re.test(inputString);
        //   if(isSplChar == true){
        //     var no_spl_char = inputString.replace(re,'');
        //     $scope.data.mformnumber="";
        //     $ionicLoading.hide(); 
        //     e.preventDefault();
        //     var alertPopup = $ionicPopup.alert({title: 'ERROR !',template: 'Please, use Alphabets and numbers only.'});
        //       alertPopup.then(function(res){console.log('Thank you for enter alphabets and numbers.')});
        //   }
        //   else{
            return true;
          // }
      }
    }
    // =================UPLOAD DOCUMENT================= //
    $scope.takePicture = function () {
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner><br>Opening Camera<br>Please Wait...',
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 0
      });
      var options = {
        quality: 15,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: false,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false,
        correctOrientation:true
      };
      $cordovaCamera.getPicture(options).then(function (imageData) {
        $ionicLoading.hide(); 
        $scope.cameraimage = "data:image/jpeg;base64," + imageData;
      }, function (err) {
        $ionicLoading.hide(); 
        $scope.cameraimage = "";
      });
    }

    $scope.sendPicture = function(image){
      // $ionicLoading.show({
      //   template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Uploading Documents<br>Please Wait...',
      //   content: 'Loading',
      //   animation: 'fade-in',
      //   showBackdrop: false,
      //   maxWidth: 200,
      //   showDelay: 0
      // });
      var userInfo = $localstorage.getObject('userInfo');
      $scope.apiHash = "";
      var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })

      $scope.data = {};
      var myPopup = $ionicPopup.show({
        template: '<input type="tel" ng-minlength="1" ng-pattern="/^[0-9]*$/" required ng-model="data.number">',
        title: 'Enter M-Form Number for Document',
        subTitle: '<p>Please Enter Digit Only...</p>',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Upload</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.number) {
                e.preventDefault();
              } else {
                var postData = {"token":userInfo.token,"user_id":userInfo.user_id,"api_hash":apiHash,"mform_number":$scope.data.number,"mforn_doc":image};
                var url = appConstants.apiUrl+'saveMformDocument';
                LoginService.postHttpRequest(url,postData).success(function(postResponse){
                  if(postResponse.STATUS != 200){
                      $ionicLoading.hide(); 
                      $scope.cameraimage = "";
                      $scope.formData = "";
                      return alertPopup = $ionicPopup.alert({title: postResponse.MSG ,
                                                          template: postResponse.RESPONSE});
                  }
                  if(postResponse.STATUS == 200){
                    $ionicLoading.hide(); 
                    $scope.cameraimage = "";
                    $scope.formData = "";
                    return alertPopup = $ionicPopup.alert({title: postResponse.MSG ,
                                                          template: postResponse.RESPONSE});
                  }
                })
              }
            }
          }
        ]
      });
    }

    // =================UPLOAD LOCATION================= //
    $scope.getCurrentLocation=function(){
      $scope.errorMsg= "";
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner><br>Fetching Your Current Location<br>Please Wait !',
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 0
      });
      var options = {
          timeout: 10000,
          enableHighAccuracy: true
      };
      $cordovaGeolocation.getCurrentPosition(options).then(function(position){
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var mapOptions = {
            center: latLng,
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
        var myCity = new google.maps.Circle({
            center: latLng,
            radius: 30,
            strokeColor: "#8CA039",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#8CA039",
            fillOpacity: 0.4
        });
        myCity.setMap($scope.map);
        $scope.position = position;
        $ionicLoading.hide();
      },function(error){
        $scope.errorMsg = "Could not get location";
        $ionicLoading.hide();
      });      
    }
    $scope.sendLocation = function(coords){
      $ionicLoading.show({
        template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Uploading Your Curent Location<br>Please Wait !',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 0
      });
      var options = {
          timeout: 10000,
          enableHighAccuracy: true
      };
      $cordovaGeolocation.getCurrentPosition(options).then(function(position){
        // var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var userInfo = $localstorage.getObject('userInfo');
        $scope.apiHash = "";
        var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
        var postData = {'token':userInfo.token,'user_id':userInfo.user_id,'longitude':position.coords.longitude,'latitude':position.coords.latitude,'api_hash':apiHash};
        var url = appConstants.apiUrl+'saveGeoLocationOfUser';
        LoginService.postHttpRequest(url,postData).success(function(postResponse){
          if(postResponse.STATUS != 200){
              $ionicLoading.hide(); 
              $scope.cameraimage = "";
              var alertPopup = $ionicPopup.alert({title:postResponse.MSG ,
                                                  template: postResponse.RESPONSE});
              // goHome();
          }
          if(postResponse.STATUS == 200){
            $ionicLoading.hide(); 
            var alertPopup = $ionicPopup.alert({title:postResponse.MSG ,
                                                template: postResponse.RESPONSE});
            // goHome();
          }
        })
      },function(error){
        $scope.errorMsg = "Could not get location";
        $ionicLoading.hide();
      })
    } 

    // ================= SECTION HELPLINE================= //
    $scope.callHelpline = function() {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Call Helpline <br> 0177-2657339',
        template: 'Are you sure you want to call ?'
      });

      confirmPopup.then(function(res) {
        if(res) {
          goHome();
          window.location.href = 'tel:01772657339';
        } else {
          goHome();
        }
      });
    };

    // ================= SECTION MAIL================= //
    $scope.mailQuery = function() {
      $cordovaEmailComposer.isAvailable().then(function() {
        var email = {
          to: 'geologicalwing@gmail.com',
          cc: [],
          bcc: [],
          // attachments: ['file://img/logo.png','res://icon.png','base64:icon.png//iVBORw0KGgoAAAANSUhEUg...','file://README.pdf'],
          subject: 'Mining Query',
          body: '',
          isHtml: true
        };
        $cordovaEmailComposer.open(email).then(null, function () {
          goHome();
        });
      }, function () { });
    };

    // ================= SECTION USSD================= //
    $scope.ussd = function() {
      $scope.data = {};
      var myPopup = $ionicPopup.show({
        template: '<input type="tel" ng-model="data.wifi">',
        title: 'Enter Your USSD CODE',
        subTitle: 'Please use normal things',
        scope: $scope,
        buttons: [
          { text: 'Cancel',
            type: 'button-assertive',
            onTap: function() {
                  goHome();
            } 
          },
          {
            text: '<b>Send</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.wifi) {
                e.preventDefault();
              } else {
                $ionicLoading.show({
                  template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Response for <br> USSD Code :: '+$scope.data.wifi+'<br>Please Wait !',
                  content: 'Loading',
                  animation: 'fade-in',
                  showBackdrop: false,
                  maxWidth: 200,
                  showDelay: 0
                });
                $timeout(function () {
                  $ionicLoading.hide();
                  var alertPopup = $ionicPopup.alert({title: 'This feature is in progress.'});
                  goHome();
                }, 2000);
              }
            }
          }
        ]
      });
    };

    if (!$scope.item.color) {
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
        });
        if(userInfo.role_id != 0)
          $state.go('app.Depdasboard');
        else
          $state.go('app.invDashboard');
    }    
    function goHome(){
      $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.nextViewOptions({
            disableBack: true,
            disableAnimate : true,
            historyRoot  : true
        });
        if(userInfo.role_id != 0)
          $state.go('app.Depdasboard');
        else
          $state.go('app.invDashboard');
    }
    $scope.getDate=function(date){
        return new Date(date);
    }
})

//====================================================================================================================//
//=============================================INVESTOR SECTIONS======================================================//
//====================================================================================================================//

app.controller('InvestorController', function($state,$cordovaNetwork, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory) {
  var userInfo = $localstorage.getObject('userInfo');
  console.log(userInfo);
  
  if(!angular.isUndefined(userInfo.token) && !angular.isUndefined(userInfo.user_id)){

    //Check Internet Connection
    // listen for Online event
   

    
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Applications<br>Please Wait !'});
    
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M", "api_hash":apiHash, "user_id":userInfo.user_id,"app_id":1};
    var url = appConstants.apiUrl+'GetUsersSubApplications';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
           var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
          // goHome();
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        $scope.apps = postResponse.RESPONSE.apps;
        $scope.appStatus = postResponse.RESPONSE.appStatus;
        console.log( postResponse.RESPONSE);
      
      }
    })
  }else{
    goHome();
  }
 

 
 
  $ionicModal.fromTemplateUrl('templates/modals/paymentReciept.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.timeLineView = function(app_id) {
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching TimeLine<br>Please Wait !'});
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M", "api_hash":apiHash,"user_id":userInfo.user_id, "submission_id":app_id};
    var url = appConstants.apiUrl+'GetUsersTimeline';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          $scope.data.mformnumber="";
          var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        $scope.TimeLines = postResponse.RESPONSE;
        $scope.modal.show();
      }
    })
  };

  $ionicModal.fromTemplateUrl('templates/modals/appView.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal2 = modal;
  });

  $scope.AppView = function(data) {
    $scope.data = data;
    console.log($scope.data);
    $scope.modal2.show();
  };
  
  $scope.closeModal = function() {
    $scope.modal.hide();
    $scope.modal2.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
    $scope.modal2.remove();
  });

  $scope.getDate=function(date){
      return new Date(date);
  }    
  function goHome(){
    $ionicViewSwitcher.nextDirection('back');
      $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
      });
      if(userInfo.role_id != 0)
        $state.go('app.Depdasboard');
      else
        $state.go('app.invDashboard');  //Go to app.Landing

  }

  $scope.getMessage=function(submission_id){
    // alert(submission_id);

    //get data from server on the basis of sumbission id
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Payment Details<br>Please Wait !'});
    var postData = {"subId":submission_id};
    var url = appConstants.apiUrl+'DownloadInvoice';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          $scope.data.mformnumber="";
          var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.RESPONSE});
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        $scope.TimeLines = postResponse.DATA;
        console.log(postResponse.DATA);
        $scope.modal.show();
      }
    });
  }

  


})


app.controller('TransitPassRequestController', function($state,$cordovaNetwork, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory) {
  var userInfo = $localstorage.getObject('userInfo');
  console.log(userInfo);
  
  if(!angular.isUndefined(userInfo.token) && !angular.isUndefined(userInfo.user_id)){

    //Check Internet Connection
    // listen for Online event
   

    
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Applications<br>Please Wait !'});
    
  
    $ionicLoading.hide();
       
  }else{
    goHome();
  }
 

  function goHome(){
    $ionicViewSwitcher.nextDirection('back');
      $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
      });
      if(userInfo.role_id != 0)
        $state.go('app.Depdasboard');
      else
        $state.go('app.transitPassRequest');  //Go to app.Landing

  }
 

})

//######################################################################################################################################

app.controller('GenerateTransitPass', function($state,$cordovaNetwork, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory) {
  var userInfo = $localstorage.getObject('userInfo');
 
  if(!angular.isUndefined(userInfo.token) && !angular.isUndefined(userInfo.user_id)){

    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Detail<br>Please Wait !'});
    console.log(userInfo.user_id);
    var postData = {"uid":userInfo.user_id,};
    var url = appConstants.apiUrl+'getPrevMonthsWXForms';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
           $ionicLoading.hide();
          // var alertPopup = $ionicPopup.alert({title: postResponse.STATUS +" :: "+ postResponse.ERROR ,
          //                                     template: postResponse.RESPONSE});
          // goHome();
          alert(postResponse);
          console.log(postResponse);
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        console.log(postResponse.DATA);
         $scope.SubmissionId=postResponse.DATA.LastApprovedTransitPass.submission_id;
         $scope.incmpte_data = JSON.parse(postResponse.DATA.LastApprovedTransitPass.field_value);
         console.log(   $scope.incmpte_data.type_of_form_requested );
        // var mform_type = "";
        // angular.forEach(postResponse.RESPONSE, function(value, key) {
        //   if(key == 'M-Form Type')
        //     mform_type = value;
        // });
        // $scope.formData={mform_type:mform_type,mform_number:postResponse.RESPONSE.Number,mform_id: postResponse.RESPONSE.Master_ID};
      }
    })

    // /**
    //  * TODO
    //  */
    // console.log(userInfo.user_id);
    // $ionicLoading.hide();
    // //Get the Data from the Server
    // var postData = {"user_id":userInfo.user_id};
   
    // var url = appConstants.apiUrl+'GetPrevMonthsWXForms';
    // LoginService.postHttpRequest(url,postData).success(function(postResponse){
    //   if(postResponse.STATUS != 200){
    //     $ionicLoading.hide();
       
    //                                         alert(postResponse);
    //     // goHome();
    // }else{
    //     alert(postResponse);
    // }

    // });
  
  
  
       
  }else{
    goHome();
  }
 

  function goHome(){
    $ionicViewSwitcher.nextDirection('back');
      $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
      });
      if(userInfo.role_id != 0)
        $state.go('app.Depdasboard');
      else
        $state.go('app.transitPassRequest');  //Go to app.Landing

  }

  $scope.submitSubmissionId = function (formData){
  // console.log(formData);
  // console.log( $scope.incmpte_data.type_of_form_requested);
  

    if(formData.SubmissionId==="" || formData.SubmissionId==null){
     // alert(formData.SubmissionId);
      var alertPopup = $ionicPopup.alert({title: "Error" +" :: "+ "Select Transit Pass Id" , template: "Please Select Transit Pass ID"});
    }else{
    
            $state.go('app.mFormView',{mFormDetails:formData.SubmissionId});
         

    
    }

  }
 

})

app.controller('mFormViewController', function($state, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory) {
  var formData =   $state.params.mFormDetails;
  var userInfo = $localstorage.getObject('userInfo');
  $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Detail<br>Please Wait !'});
     if(!angular.isUndefined(userInfo.token) && !angular.isUndefined(userInfo.user_id)){
    


      if(formData==="" || formData==null){
     // alert(formData.SubmissionId);
      var alertPopup = $ionicPopup.alert({title: "Error" +" :: "+ "Select Transit Pass Id" , template: "Please Select Transit Pass ID"});
    }else{
      var postData = {"submission_id":formData};
      var url = appConstants.apiUrl+'MFormRequestCreate';
     LoginService.postHttpRequest(url,postData).success(function(postResponse){
       if(postResponse.STATUS != 200){
            $ionicLoading.hide();
 
           
 
            var alertPopup = $ionicPopup.alert({title: postResponse.STATUS +" :: "+ postResponse.ERROR , template: postResponse.RESPONSE});
           goHome();
            alert(postResponse);
           
        }
        if(postResponse.STATUS == 200){ 
          $ionicLoading.hide();
          $scope.mform_Data = postResponse.DATA;
          // console.log(postResponse);
          // console.log(postResponse.DATA.mform_type);
          // console.log(postResponse.DATA.mform_num);
          // console.log(postResponse.DATA.mform_type);
            //Go to mFormView and pass Variables to it
         //   $scope.mFormData=postResponse.DATA;
          // var mform_type = "";
          // angular.forEach(postResponse.RESPONSE, function(value, key) {
           //  if(key == 'M-Form Type')
            //   mform_type = value;
           //});
          //  $scope.x={"mformType":postResponse.Data.mform_type,"mform_number":postResponse.DATA.Number,"mform_id": postResponse.DATA.Master_ID};
          //  console.log($scope.x);
        }
      })

    
    }





    $scope.GenerateMform = function(formData) {
      // $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Submitting M-Form<br>Please Wait !'});
      $scope.apiHash = "";
      var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
      var postData = {"token":userInfo.token, "api_hash":apiHash,"user_id":userInfo.user_id,
                      'mform_id': $scope.mform_Data.app_sub_id,
                      'mform_number': $scope.mform_Data.mform_num,
                      'mform_type': $scope.mform_Data.mform_type,
                      'agree_terms_condition': formData.agree_terms_condition,
                      'mode_of_transport': formData.mode_of_transport,
                      'name_of_contractor':formData.name_of_contractor,
                      'location_of_mine':formData.location_of_mine,
                      'place_where_mineral_is_being_sent':formData.place_where_mineral_is_being_sent,
                      'name_of_party':formData.name_of_party,
                      'name_of_mineral':formData.name_of_mineral,
                      'vehicle_number':formData.vehicle_number,
                      'driver_mobile_number':formData.driver_mobile_number,
                      'driver_full_name':formData.driver_full_name,
                      'name_of_owner_of_vehicle':formData.name_of_owner_of_vehicle,
                      'quantity_carrying':formData.quantity_carrying,
                      'quantity_unit':formData.quantity_unit
                     };
                     console.log(postData);
      var url = appConstants.apiUrl+'GenerateUserMform';
      LoginService.postHttpRequest(url,postData).success(function(postResponse){
        if(postResponse.STATUS != 200){
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,
                                                template: postResponse.RESPONSE});
            // goHome();
        }
        if(postResponse.STATUS == 200){
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,
                                              template: postResponse.RESPONSE});
          goHome();
        }
      })
    }
  }else{
    goHome();
  }
    
  function goHome(){
    $ionicViewSwitcher.nextDirection('back');
      $ionicHistory.nextViewOptions({
          disableBack: true,
          disableAnimate : true,
          historyRoot  : true
      });
      if(userInfo.role_id != 0)
        $state.go('app.Depdasboard');
      else
        $state.go('app.invDashboard');

  }
})


app.controller('LocationCtrl', function($state, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory){
  var userInfo = $localstorage.getObject('userInfo');
  $scope.getLoactions = function() {
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Upload Locations<br>Please Wait !'});
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M","api_hash":apiHash,"user_id":userInfo.user_id, "token":userInfo.token,"role_id":userInfo.role_id};
    var url = appConstants.apiUrl+'getUploadedLocations';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          // $scope.data.mformnumber="";
          // var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
          $scope.locations = "";
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        $scope.locations = postResponse.RESPONSE;
      }
    })
  };
  $ionicModal.fromTemplateUrl('templates/modals/LoadMap.html', {
    scope: $scope,
    animation: 'animated pulse'
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.comment = "";
  });
  $scope.showLocation=function(longitude,latitude,name,date,geo_id){
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner><br>Uploading Location<br>Please Wait !',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 200
      });
      $scope.apiHash = "";
      var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
      var postData = {"source":"M","api_hash":apiHash,"geo_id":geo_id,"user_id":userInfo.user_id, "token":userInfo.token};
      var url = appConstants.apiUrl+'getUpLocComments';
      LoginService.postHttpRequest(url,postData).success(function(postResponse){
        if(postResponse.STATUS != 200){
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
        }
        if(postResponse.STATUS == 200){
          $ionicLoading.hide();
          $scope.modal.show();
          var options = {
              timeout: 10000,
              enableHighAccuracy: true
          };
          var latLng = new google.maps.LatLng(latitude,longitude);
          var mapOptions = {
              center: latLng,
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
          var myCity = new google.maps.Circle({
              center: latLng,
              radius: 25,
              strokeColor: "#8CA039",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#8CA039",
              fillOpacity: 0.4
          });
          var contentString = '<div id="content">'+
                                '<h4 class="title">'+name+'</h4>'+
                                '<div id="bodyContent">'+date+'</div>'+
                              '</div>';
          var infowindow = new google.maps.InfoWindow({
            content: contentString
          });
          var marker = new google.maps.Marker({
             position: latLng,
             map: $scope.map,
             title : "Oficer Location"
          });
          infowindow.open($scope.map, marker);
          myCity.setMap($scope.map);
          $scope.geo_id = geo_id;
          $scope.comment = "";
          $scope.comments = postResponse.RESPONSE;
        }
      })
  }
  
  $scope.closeModal = function() {
    $scope.comment = "";
    $scope.modal.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  $scope.SaveComment=function(geo_id){
    console.log(geo_id);
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Saving Location Comment<br>Please Wait !'});
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M","api_hash":apiHash,"geo_id":geo_id,"comment":$scope.data.comment,"user_id":userInfo.user_id, "token":userInfo.token};
    var url = appConstants.apiUrl+'saveUpLocComments';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,template: postResponse.RESPONSE});
      }
      if(postResponse.STATUS == 200){
        $scope.data.comment="";
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,template: postResponse.RESPONSE});
        $scope.modal.hide();
      }
    })
  }

  $scope.getDate=function(date){
    return new Date(date);
  }
})

app.controller('DocCommentsCtrl', function($state, $cordovaCamera, $cordovaGeolocation, $scope, $location, $ionicModal, $ionicPopover, $timeout, $ionicPopup, LoginService, storeToken, $localstorage, $ionicLoading, appConstants, $http, $stateParams, $ionicViewSwitcher, $ionicHistory){
  var userInfo = $localstorage.getObject('userInfo');
  $scope.getDocuments = function() {
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Document<br>Please Wait !'});
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M","api_hash":apiHash,"user_id":userInfo.user_id, "token":userInfo.token,"role_id":userInfo.role_id};
    var url = appConstants.apiUrl+'getDocuments';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          // var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
          $scope.documents = "";
      }
      if(postResponse.STATUS == 200){
        $ionicLoading.hide();
        $scope.documents = postResponse.RESPONSE;
      }
    })
  };

  $ionicModal.fromTemplateUrl('templates/modals/DocComments.html', {
    scope: $scope,
    animation: 'animated pulse'
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.comment = "";
  });
  $scope.getComments=function(doc_id,image){
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Fetching Document Comments<br>Please Wait !'});
      $scope.apiHash = "";
      var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
      var postData = {"source":"M","api_hash":apiHash,"doc_id":doc_id,"user_id":userInfo.user_id, "token":userInfo.token};
      var url = appConstants.apiUrl+'getDocsComments';
      LoginService.postHttpRequest(url,postData).success(function(postResponse){
        if(postResponse.STATUS != 200){
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({title: 'ERROR :: '+postResponse.STATUS ,template: postResponse.MSG});
        }
        if(postResponse.STATUS == 200){
          $scope.data.comment="";
          $ionicLoading.hide();
          $scope.modal.show();
          $scope.image=image;
          $scope.doc_id=doc_id;
          $scope.comments = postResponse.RESPONSE;
        }
      })
  }
  
  $scope.closeModal = function() {
    $scope.data.comment="";
    $scope.modal.hide();
    $scope.modalimage.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
    $scope.modalimage.remove();
  });

  $scope.SaveComment=function(doc_id){
    console.log(doc_id);
    $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-energized"></ion-spinner><br>Saving Document Comments<br>Please Wait !'});
    $scope.apiHash = "";
    var apiHash = LoginService.generateHash(userInfo.user_id+userInfo.token,appConstants).success(function(hash){ return hash; })
    var postData = {"source":"M","api_hash":apiHash,"doc_id":doc_id,"comment":$scope.data.comment,"user_id":userInfo.user_id, "token":userInfo.token};
    var url = appConstants.apiUrl+'saveDocsComments';
    LoginService.postHttpRequest(url,postData).success(function(postResponse){
      if(postResponse.STATUS != 200){
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,template: postResponse.RESPONSE});
      }
      if(postResponse.STATUS == 200){
        $scope.data.comment="";
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({title: postResponse.MSG ,template: postResponse.RESPONSE});
        $scope.modal.hide();
      }
    })
  }

  $ionicModal.fromTemplateUrl('templates/modals/image-popover.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modalimage = modal;
  });

  $scope.showImages = function(image) {
    $scope.image = image;
    $scope.modalimage.show();
  }

  $scope.getDate=function(date){
    return new Date(date);
  }
})