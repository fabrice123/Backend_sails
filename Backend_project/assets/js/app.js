/**
 * Created by Niels on 15/12/2014.
 */
//self invoking to declare no global variables
(function (angular) {
    "use strict";
    //looks like the most supported file upload https://github.com/danialfarid/angular-file-upload
    angular.module('app', [ 'ngCookies', 'ngRoute', 'ngMaterial' , 'ngSails', 'angularFileUpload', 'youtube-embed'])
        .config(['$routeProvider', '$sailsProvider', function ($routeProvider, $sailsProvider) {

            $routeProvider.when('/', {
                templateUrl: 'templates/login.html',
                controller: 'loginController'
            })
                .when('/register', {
                    templateUrl: 'templates/register.html',
                    controller: 'registerController'
                })
                .when('/room', {
                    templateUrl: 'templates/roomForm.html',
                    controller: 'roomFormController'
                })
                .when('/room/:roomName', {
                    templateUrl: 'templates/room.html',
                    controller: 'roomController'
                })
                .otherwise({
                    redirectTo: '/'
                });

            $sailsProvider.url = '/';
        }])
        .controller('rootController', ['$scope', function ($scope) {
            $scope.isLoggedIn = false;
            $scope.actions = [];
        }])
        .controller('loginController', ['$scope', '$cookies', '$location','$sails','$mdToast', function ($scope, $cookies, $location,$sails,$mdToast) {
            //setting the length to 0, empties the array
            $scope.actions.length = 0;
            $scope.$parent.title = "Media Chat";
            //check if cookie for roomName and username exists, if so, route to roomController

            $scope.username = $cookies.username;

            //set the username cookie when set and route to the roomController with route
            ///logging in is not the intention over here, the logging in happens in the roomController and chatController

            $scope.login = function(username, password) {
                $cookies.username = username;
                $sails.post('/login',{username:username,password:password}).success(function(resp){
                    console.log(resp);
                    if(resp.error){
                        createToast(resp.reason);
                    }else{
                        $location.path("/room");
                    }
                }).error(function(error){
                    console.log('error');
                    if(error.error&&error.reason){
                        createToast(resp.reason);
                    }
                });
            };
            function createToast(message){
                $mdToast.show(
                    $mdToast.simple().content(message)
                );
            }
        }])
        .controller('registerController', ['$scope', '$cookies', '$location','$sails', function ($scope, $cookies, $location, $sails) {
            //setting the length to 0, empties the array
            $scope.actions.length = 0;
            $scope.$parent.title = "Media Chat";
            //check if cookie for roomName and username exists, if so, route to roomController
            $scope.username = $cookies.username;

            //set the username cookie when set and route to the roomController with route
            ///logging in is not the intention over here, the logging in happens in the roomController and chatController
            function register(username, password) {
                var user = {username:username,password:password};
                $sails.post('/user',user)
                    .success(function(resp1){
                        console.log(resp1);
                        $sails.post('/login',user).success(function(resp2){
                            console.log(resp2);
                            $cookies.username = username;
                            $location.path("/room");
                        }).error(function(error){
                            console.log('error');
                        });
                    })
            }

            $scope.register = register;
        }])
        .controller('roomFormController', ['$scope', '$cookies', '$location','$sails', function ($scope, $cookies, $location,$sails) {
            //setting the length to 0, empties the array
            $scope.actions.length = 0;

            $scope.actions.push(
                {
                    icon: "mdi-account-circle mdi-2x",
                    title: "Log "+$cookies.username+" out",
                    execute: function () {
                        $sails.get("/logout").success(function(message){
                            console.log(message);
                            $location.path("/");
                        });
                    }
                }
            );

            $scope.$parent.title = "Media Chat";

            $scope.room = $cookies.roomName;
            $scope.joinRoom=function(roomName) {
                $location.path("/room/"+roomName);
            }
        }])
        .controller('roomController', ['$scope', '$cookies', '$cookieStore', '$routeParams', '$sails', '$location', '$mdDialog', '$mdBottomSheet', '$timeout', function ($scope, $cookies, $cookieStore, $routeParams, $sails, $location, $mdDialog, $mdBottomSheet, $timeout) {
            $scope.counter = 0;
            $scope.likes=0;
            $scope.dislikes=0;

            var messenger = $('#messenger');
            messenger.velocity({opacity: 0}, 0);
            messenger.velocity({scale: 0}, 0);
            $scope.showHideMessenger = true;
            $scope.showMessenger = function () {
                //TODO: Why not use a boolean? Or are there more than two states possible in the future? fe: $scope.isMessengerVisible=false
                if ($scope.counter == 0) {
                    messenger.velocity({opacity: 1}, 200);
                    messenger.velocity({scale: 1}, 400);
                    $scope.counter++;
                }
                else {
                    $scope.counter = 0;
                    messenger.velocity({scale: 0}, 400);
                    messenger.velocity({opacity: 0}, 500);
                }
            };

            //set the roomName cookie and get the username cookie
            var roomConstants = {
                join: 'roomJoinEvent',
                leave: 'roomLeaveEvent',
                notifyContentChanged:'notifyContentChanged',
                like:'like',
                dislike:'dislike'
                },
                username = $cookies.username,
                roomName = $routeParams.roomName;
            $scope.roomName = roomName;
            $scope.$parent.title = "Media Chat: Room " + roomName;
            $scope.username = username;
            $scope.users = [];

            $cookies.roomName = roomName;

            $scope.actions.length = 0;
            $scope.actions.push(
                {
                    icon: "mdi-exit-to-app mdi-2x",
                    title: "Change room",
                    execute: function () {
                        $sails.post("/room/leave", {username: username, roomName: roomName});
                        $cookieStore.remove('roomName');
                        $location.path("/room");
                    }
                }
            );
            $scope.actions.push(
                {
                    icon: "mdi-account-circle mdi-2x",
                    title: "Log "+username+" out",
                    execute: function () {
                        $sails.post("/room/leave", {username: username, roomName: roomName});
                        $sails.get("/logout").success(function(message){
                            console.log(message);
                            $location.path("/");
                        });
                        $cookieStore.remove('roomName');
                    }
                }
            );


            //login to the roomController
            (function joinRoom() {
                $sails.post("/room/join", {username: username, roomName: roomName})
                    .success(getUsers);
            })();
            function getUsers() {
                return $sails.get("/room/" + roomName + "/users", function (users) {
                    $scope.users=users;
                    console.log(users);
                });
            }
            function getContent(){
                $sails.get("/room/"+roomName+"/currentContent",function(content){
                    $scope.content=content;
                });
            }
            getContent();

            //content moet hier
            //$scope.content=content
            /*$scope.content={};
            $scope.content.loves=15;
            $scope.content.hates=70;*/
          /* $scope.average=$scope.content.loves+$scope.content.hates
            $scope.likes= ($scope.content.loves/$scope.average)*100;
            $scope.dislikes= ($scope.content.hates/$scope.average)*100;*/


            $scope.tinderYes=function(){
                if($scope.content){
                    $sails.post('/room/like',{
                        username:username,
                        roomName:roomName,
                        contentId:$scope.content.id
                    });
                }
            };
            $scope.tinderNo=function(){
                if($scope.content){
                    $sails.post('/room/dislike',{
                        username:username,
                        roomName:roomName,
                        contentId:$scope.content.id
                    });
                }
            };

            function addUser(username) {
                var user = {username:username};
                $scope.users.push(user);
            }
            function removeUser(username) {
                for(var i =0;i<$scope.users.length;i++){
                    var user = $scope.users[i];
                    if(user.username==username) {
                        $scope.users.splice(i,1);
                    }
                }
            }
            $sails.on(roomConstants.join, function (joinMessage) {
                console.log(joinMessage);
                addUser(joinMessage.username);
            });
            $sails.on(roomConstants.leave, function (leaveMessage) {
                console.log(leaveMessage);
                removeUser(leaveMessage.username);
            });
            $sails.on(roomConstants.notifyContentChanged, function (notifyMessage) {
                console.log(notifyMessage);
                getContent();
            });
            $sails.on(roomConstants.like,function(likeUpdate){
                var content = likeUpdate.content;
                $scope.content.loves=content.loves;
            });
            $sails.on(roomConstants.dislike,function(dislikeUpdate){
                var content = dislikeUpdate.content;
                $scope.content.hates=content.hates;
            });

            $scope.showContentPicker = function () {
                $mdBottomSheet.show({
                    templateUrl: 'templates/content-picker.html',
                    controller: 'contentPickerController'
                })
            };
        }])
        .controller('contentPickerController',['$scope','$mdDialog','$mdBottomSheet',function($scope,$mdDialog,$mdBottomSheet){
            $scope.contentItems=[{
                action:showPictureForm,
                icon:'mdi-insert-photo mdi-3x',
                name:'Photo'
            },{
                action:showYoutubeForm,
                icon:'mdi-video-collection mdi-3x',
                name:'Youtube'
            },
            {
                action: showMusicForm,
                icon: 'mdi-my-library-music mdi-3x',
                name: 'Music'
            }];
            $scope.pickContent=function(item){
                item.action();
                $mdBottomSheet.hide();
            };

            function showPictureForm() {
                $mdDialog.show({
                    templateUrl: 'templates/uploadPictureForm.html',
                    controller: 'uploadPictureController'
                });
            }

            function showYoutubeForm() {
                $mdDialog.show({
                    templateUrl: 'templates/youtubeForm.html',
                    controller: 'youtubeFormController'
                });
            }

            function showMusicForm() {
                $mdDialog.show({
                    templateUrl: 'templates/uploadMusicForm.html',
                    controller: 'uploadMusicFormController'
                });
            }
        }])
        .controller('uploadPictureController', ['$scope', '$routeParams', '$cookies', '$sails', '$upload', '$mdDialog', function ($scope, $routeParams, $cookies, $sails, $upload, $mdDialog) {
            var roomName = $routeParams.roomName,
                username = $cookies.username;

            $scope.uploadPicture = function (title, file) {
                if(title&&file){
                    $scope.upload = $upload.upload({
                        url: '/room/upload',
                        method: 'POST',
                        file: file,
                        data: {username: username, roomName: roomName, title: title}

                    }).progress(function (evt) {
                        console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :' + evt.config.file.name);
                    }).success(function (content, status, headers, config) {
                        // file is uploaded successfully
                        console.log('file ' + config.file.name + 'is uploaded successfully. Response: ' + content);
                        changeContent(content.id);
                        $mdDialog.hide();
                    });
                }
            };

            function changeContent(contentId) {
                $sails.post("/room/changeContent", {roomName: roomName, contentId: contentId});
            }
        }])
        .controller('uploadMusicFormController', ['$scope', '$routeParams', '$cookies', '$sails', '$upload', '$mdDialog', function ($scope, $routeParams, $cookies, $sails, $upload, $mdDialog) {
            var roomName = $routeParams.roomName,
                username = $cookies.username;

            $scope.uploadSong = function (title, file) {
                if(title&&file){
                    $scope.upload = $upload.upload({
                        url: '/room/upload',
                        method: 'POST',
                        file: file,
                        data: {username: username, roomName: roomName, title: title}

                    }).progress(function (evt) {
                        console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :' + evt.config.file.name);
                    }).success(function (content, status, headers, config) {
                        // file is uploaded successfully
                        console.log('file ' + config.file.name + 'is uploaded successfully. Response: ' + content);
                        changeContent(content.id);
                        $mdDialog.hide();
                    });
                }
            };

            function changeContent(contentId) {
                $sails.post("/room/changeContent", {roomName: roomName, contentId: contentId});
            }
        }])
        .controller('youtubeFormController', ['$scope', '$routeParams', '$cookies', '$sails', '$upload', '$mdDialog', function ($scope, $routeParams, $cookies, $sails, $upload, $mdDialog) {
            var roomName = $routeParams.roomName,
                username = $cookies.username;
            $scope.youtubeLink="";
            $scope.insertYoutubeLink=function(title,link){
                console.log(link);
                $sails.post("/content",{
                    title: title,
                    path: link,
                    contentType:"ytb",
                    uploadedBy:username
                }).then(function(data){
                    changeContent(data.id);
                    $mdDialog.hide();
                });
            };
            function changeContent(contentId) {
                $sails.post("/room/changeContent", {roomName: roomName, contentId: contentId});
            }
        }])

        .controller('chatController', ['$scope', '$cookies', '$routeParams', '$sails', '$timeout', function ($scope, $cookies, $routeParams, $sails, $timeout) {
            //get the username and roomName cookies to login to the ChatController
            var chatConstants = {
                    join: 'chatJoinEvent',
                    send: 'chatSendEvent',
                    userIsTyping: 'chatUserIsTypingEvent',
                    leave: 'chatLeaveEvent'
                },
                username = $cookies.username,
                roomName = $routeParams.roomName,
                hasUserNotifiedTyping = false,
                userIsTypingTime = 4000;

            $scope.messages = [];
            $scope.message = "";
            $scope.username = username;
            $scope.roomName = roomName;
            $scope.userIsTypingMessage = null;


            $scope.send = function (message) {
                var messageRequest = {username: username, roomName: roomName, message: message};
                $sails.post("/chat/send", messageRequest);
                $scope.messages.push(messageRequest);
                $scope.message = "";
            };
            $scope.enterEvent = function (e, message) {
                if (e.keyCode == 13) {
                    $scope.send(message);
                }
            };


            (function joinRoom() {
                $sails.post("/chat/join", {username: username, roomName: roomName});
            })();

            $scope.notifyUserIsTyping = function () {
                if (!hasUserNotifiedTyping) {
                    $sails.post("/chat/userIsTyping", {username: username, roomName: roomName});
                    hasUserNotifiedTyping = true;
                    setTimeout(
                        function () {
                            hasUserNotifiedTyping = false;
                        },
                        userIsTypingTime
                    );
                }
            };
            $sails.on(chatConstants.join, function (joinMessage) {
                console.log(joinMessage);
                joinMessage.message = joinMessage.username + " has joined the room";
                $scope.messages.push(joinMessage);
            });
            $sails.on(chatConstants.send, function (sendMessage) {
                console.log(sendMessage);
                $scope.messages.push(sendMessage);
            });
            $sails.on(chatConstants.leave, function (leaveMessage) {
                console.log(leaveMessage);
                leaveMessage.message = leaveMessage.username + " has left the room";
                $scope.messages.push(leaveMessage);
            });
            $sails.on(chatConstants.userIsTyping, function (typingMessage) {
                $scope.userIsTypingMessage = typingMessage.username + ' is typing';
                $timeout(function () {
                    $scope.userIsTypingMessage = "";
                }, userIsTypingTime);
            });
        }]);
})(angular);