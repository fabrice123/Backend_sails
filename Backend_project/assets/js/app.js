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
            $scope.title = "Media Chat";
            $scope.isLoggedIn = false;
            $scope.actions = [];
        }])
        .controller('loginController', ['$scope', '$cookies', '$location', function ($scope, $cookies, $location) {
            //setting the length to 0, empties the array
            $scope.actions.length = 0;

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


            $scope.randomcolor = function () {

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
                    notifyContentChanged: 'notifyContentChanged'
                },
                userName = $cookies.userName,
                roomName = $routeParams.roomName;
            $scope.roomName = roomName;
            $scope.$parent.title = "Media Chat: Room " + roomName;
            $scope.userName = userName;
            $scope.users = [];

            $cookies.roomName = roomName;

            $scope.actions.length = 0;
            $scope.actions.push({icon: "mdi-settings-power mdi-2x", execute: function () {
                $sails.post("/room/leave", {userName: userName, roomName: roomName});
                $cookieStore.remove('roomName');
                $location.path("/");
            }
            });


            //login to the roomController
            (function joinRoom() {
                $sails.post("/room/join", {userName: userName, roomName: roomName});
            })();
            function getUsers() {
                return $sails.get("/room/" + roomName + "/users", function (users) {
                    $timeout(function () {
                        $scope.users = users;
                        for (var i = 0; i < $scope.users.length; ++i) {
                            $scope.users[i].first = $scope.users[i].name.substr(0, 1);
                            console.log($scope.users[i].first);
                        }
                    }, 500);

                    console.log(users);


                });
            };
            getUsers();

            //content moet hier
            //$scope.content=content
            /*$scope.content={};
            $scope.content.loves=15;
            $scope.content.hates=70;*/
          /* $scope.average=$scope.content.loves+$scope.content.hates
            $scope.likes= ($scope.content.loves/$scope.average)*100;
            $scope.dislikes= ($scope.content.hates/$scope.average)*100;*/


            $scope.tinderYes=function(){

            };
            $scope.tinderNo=function(){

            };

            $sails.on(roomConstants.join, function (joinMessage) {
                console.log(joinMessage);

                getUsers();

            });
            $sails.on(roomConstants.leave, function (leaveMessage) {
                console.log(leaveMessage);
                getUsers();
            });
            $sails.on(roomConstants.notifyContentChanged, function (notifyMessage) {
                console.log(notifyMessage);
            });
            $scope.showContentPicker = function () {
                $mdBottomSheet.show({
                    templateUrl: 'templates/content-picker.html',
                    controller: 'contentPickerController'
                })
            };
        }])
        .controller('contentPickerController', ['$scope', '$mdDialog', '$mdBottomSheet', function ($scope, $mdDialog, $mdBottomSheet) {
            $scope.contentItems = [
                {
                    action: showUploadForm,
                    icon: 'mdi-insert-photo mdi-3x',
                    name: 'Photo'
                },
                {
                    action: showYoutubeForm,
                    icon: 'mdi-video-collection mdi-3x',
                    name: 'Youtube'
                },
                {
                    action: showMusicForm,
                    icon: 'mdi-my-library-music mdi-3x',
                    name: 'Music'
                }
            ];
            $scope.pickContent = function (item) {
                item.action();
                $mdBottomSheet.hide();
            };

            function showUploadForm() {
                $mdDialog.show({
                    templateUrl: 'templates/upload.html',
                    controller: 'uploadController'
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
                    templateUrl: 'templates/upload.html',
                    controller: 'musicFormController'
                });
            }
        }])
        .controller('uploadController', ['$scope', '$routeParams', '$cookies', '$sails', '$upload', '$mdDialog', function ($scope, $routeParams, $cookies, $sails, $upload, $mdDialog) {
            var roomName = $routeParams.roomName,
                userName = $cookies.userName;

            $scope.$watch('files', function () {
                if ($scope.files) {
                    for (var i = 0; i < $scope.files.length; i++) {
                        var file = $scope.files[i];
                        $scope.upload = $upload.upload({
                            url: '/room/upload', // upload.php script, node.js route, or servlet url
                            method: 'POST',
                            file: file,
                            data: {userName: userName, roomName: roomName, title: 'test'}

                        }).progress(function (evt) {
                            console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :' + evt.config.file.name);
                        }).success(function (content, status, headers, config) {
                            // file is uploaded successfully
                            console.log('file ' + config.file.name + 'is uploaded successfully. Response: ' + content);
                            changeContent(content.id);
                            $mdDialog.hide();
                        });
                    }
                }
            });

            function changeContent(fileId) {
                $sails.post("/room/changeContent", {roomName: roomName, fileId: fileId});
            }
        }])

        .controller('youtubeFormController', ['$scope', '$routeParams', '$cookies', '$sails', '$upload', '$mdDialog', function ($scope, $routeParams, $cookies, $sails, $upload, $mdDialog) {
            var roomName = $routeParams.roomName,
                userName = $cookies.userName;
            $scope.youtubeLink = "";
            function changeContent(fileId) {
                $sails.post("/room/changeContent", {roomName: roomName, fileId: fileId});
            }

            $scope.insertYoutubeLink = function () {
                console.log($scope.youtubeLink);
                $sails.post("/content", {
                    title: $scope.youtubeLink,
                    path: $scope.youtubeLink,
                    contentType: "ytb",
                    uploadedBy: {
                        name: userName
                    }

                }).then(function (data) {
                    changeContent(data.id);
                })
                $mdDialog.hide();
            };


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