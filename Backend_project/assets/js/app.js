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
        .controller('loginController', ['$scope', '$cookies', '$location', function ($scope, $cookies, $location) {
            //setting the length to 0, empties the array
            $scope.actions.length = 0;
            $scope.$parent.title = "Media Chat";
            //check if cookie for roomName and userName exists, if so, route to roomController
            if ($cookies.userName && $cookies.roomName) {
                login($cookies.userName, $cookies.roomName);
            }
            $scope.userName = $cookies.userName;
            $scope.roomName = $cookies.roomName;

            //set the userName cookie when set and route to the roomController with route
            ///logging in is not the intention over here, the logging in happens in the roomController and chatController
            function login(userName, roomName) {
                $cookies.userName = userName;
                $location.path("/room/" + roomName);
            }

            $scope.login = login;
        }])
        .controller('roomController', ['$scope', '$cookies', '$cookieStore', '$routeParams', '$sails', '$location', '$mdDialog', '$mdBottomSheet', '$timeout', function ($scope, $cookies, $cookieStore, $routeParams, $sails, $location, $mdDialog, $mdBottomSheet, $timeout) {
            $scope.counter = 0;
            $scope.likes=0;
            $scope.dislikes=0;


            function randomcolor() {

                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;

            }
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

            //set the roomName cookie and get the userName cookie
            var roomConstants = {
                join: 'roomJoinEvent',
                leave: 'roomLeaveEvent',
                notifyContentChanged:'notifyContentChanged',
                like:'like',
                dislike:'dislike'
                },
                userName = $cookies.userName,
                roomName = $routeParams.roomName;
            $scope.roomName = roomName;
            $scope.$parent.title = "Media Chat: Room " + roomName;
            $scope.userName = userName;
            $scope.users = [];

            $cookies.roomName = roomName;

            $scope.actions.length = 0;
            $scope.actions.push(
                {
                    icon: "mdi-settings-power mdi-2x",
                    title: "Log "+userName+" out",
                    execute: function () {
                        $sails.post("/room/leave", {userName: userName, roomName: roomName});
                        $cookieStore.remove('roomName');
                        $location.path("/");
                    }
                }
            );


            //login to the roomController
            (function joinRoom() {
                $sails.post("/room/join", {userName: userName, roomName: roomName});
            })();
            function getUsers() {
                return $sails.get("/room/" + roomName + "/users", function (users) {
                    $timeout(function () {
                        console.log(users);
                        for (var i = 0; i < users.length; i++) {
                            addUser(users[i].name);
                        }
                    }, 0);

                    console.log(users);
                });
            }
            getUsers();
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
                        userName:userName,
                        roomName:roomName,
                        contentId:$scope.content.id
                    });
                }
            };
            $scope.tinderNo=function(){
                if($scope.content){
                    $sails.post('/room/dislike',{
                        userName:userName,
                        roomName:roomName,
                        contentId:$scope.content.id
                    });
                }
            };

            function addUser(userName) {
                var user = {name:userName};
                //user.first = user.name.substr(0, 1);
                user.color=randomcolor();
                $scope.users.push(user);
            }
            function removeUser(userName) {
                for(var i =0;i<$scope.users.length;i++){
                    var user = $scope.users[i];
                    if(user.name==userName) {
                        $scope.users.splice(i,1);
                    }
                }
            }
            $sails.on(roomConstants.join, function (joinMessage) {
                console.log(joinMessage);
                addUser(joinMessage.userName);
            });
            $sails.on(roomConstants.leave, function (leaveMessage) {
                console.log(leaveMessage);
                removeUser(leaveMessage.userName);
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
                userName = $cookies.userName;

            $scope.uploadPicture = function (title, file) {
                if(title&&file){
                    $scope.upload = $upload.upload({
                        url: '/room/upload',
                        method: 'POST',
                        file: file,
                        data: {userName: userName, roomName: roomName, title: title}

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
                userName = $cookies.userName;

            $scope.uploadSong = function (title, file) {
                if(title&&file){
                    $scope.upload = $upload.upload({
                        url: '/room/upload',
                        method: 'POST',
                        file: file,
                        data: {userName: userName, roomName: roomName, title: title}

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
                userName = $cookies.userName;
            $scope.youtubeLink="";
            $scope.insertYoutubeLink=function(title,link){
                console.log(link);
                $sails.post("/content",{
                    title: title,
                    path: link,
                    contentType:"ytb",
                    uploadedBy:userName
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
            //get the userName and roomName cookies to login to the ChatController
            var chatConstants = {
                    join: 'chatJoinEvent',
                    send: 'chatSendEvent',
                    userIsTyping: 'chatUserIsTypingEvent',
                    leave: 'chatLeaveEvent'
                },
                userName = $cookies.userName,
                roomName = $routeParams.roomName,
                hasUserNotifiedTyping = false,
                userIsTypingTime = 4000;

            $scope.messages = [];
            $scope.message = "";
            $scope.userName = userName;
            $scope.roomName = roomName;
            $scope.userIsTypingMessage = null;


            $scope.send = function (message) {
                var messageRequest = {userName: userName, roomName: roomName, message: message};
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
                $sails.post("/chat/join", {userName: userName, roomName: roomName});
            })();

            $scope.notifyUserIsTyping = function () {
                if (!hasUserNotifiedTyping) {
                    $sails.post("/chat/userIsTyping", {userName: userName, roomName: roomName});
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
                joinMessage.message = joinMessage.userName + " has joined the room";
                $scope.messages.push(joinMessage);
            });
            $sails.on(chatConstants.send, function (sendMessage) {
                console.log(sendMessage);
                $scope.messages.push(sendMessage);
            });
            $sails.on(chatConstants.leave, function (leaveMessage) {
                console.log(leaveMessage);
                leaveMessage.message = leaveMessage.userName + " has left the room";
                $scope.messages.push(leaveMessage);
            });
            $sails.on(chatConstants.userIsTyping, function (typingMessage) {
                $scope.userIsTypingMessage = typingMessage.userName + ' is typing';
                $timeout(function () {
                    $scope.userIsTypingMessage = "";
                }, userIsTypingTime);
            });
        }]);
})(angular);