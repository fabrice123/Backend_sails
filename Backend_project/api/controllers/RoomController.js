/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var roomConstants = {
    join: 'roomJoinEvent',
    leave: 'roomLeaveEvent',
    notifyContentChanged:'notifyContentChanged',
    like:'like',
    dislike:'dislike'
};
module.exports = {

    join: function (req, res) {
        var joinRequest = req.body,
            socket = req.socket;

        addUserToRoom(joinRequest.roomName,joinRequest.userName,socket);

        socket.on('disconnect',function(){
            removeUserFromRoom(joinRequest.roomName,joinRequest.userName,socket)
        });

        //removeUserFromRoom(joinRequest.roomName, joinRequest.userName, socket);
        //sails.log.info(User);
        res.end();
    },
    leave: function (req, res) {
        //TODO:removeUserFromRoom
        var joinRequest = req.body,
            socket = req.socket;
        removeUserFromRoom(joinRequest.roomName, joinRequest.userName, socket);
        //2 verschillen!!!! Models is voor database en de functie die je aanmaakt zoals join dit kan je direct aanspreken

    },
    upload: function  (req, res) {
        var uploadRequest = req.body;
        req.file('file').upload({
            dirname:"../public/uploads/"
        },function (err, files) {
            sails.log.info(files);
            if(files&&files.length>0){
                var file = files[0],
                    parts = file.fd.split('\\');
                var path = parts[parts.length-1];
                sails.log.info("path: "+path);
                addContent(uploadRequest.title,"uploads/"+path,uploadRequest.userName,file.type,function(content){
                    sails.log.info(content);
                    return res.json(content);
                });
            }
        });
    },
    changeContent:function(req, res){
        var changeContentRequest = req.body,
            socket = req.socket;
        changeContentInDb(changeContentRequest.roomName,changeContentRequest.contentId);
        sails.io.sockets.in(changeContentRequest.roomName).emit(roomConstants.notifyContentChanged,
            changeContentRequest
        );
    },
    like:function(req,res){
        var likeRequest = req.body,
            socket = req.socket;
        sails.log.info(likeRequest);
        likeContent(likeRequest.contentId,
            function(content){
                likeRequest.content=content;
                sails.io.sockets.in(likeRequest.roomName).emit(roomConstants.like,
                    likeRequest
                );
            }
        );
    },
    dislike:function(req,res){
        var dislikeRequest = req.body,
            socket = req.socket;
        sails.log.info(dislikeRequest);
        dislikeContent(dislikeRequest.contentId,
            function(content){
                dislikeRequest.content=content;
                sails.io.sockets.in(dislikeRequest.roomName).emit(roomConstants.dislike,
                    dislikeRequest
                );
            }
        );
    }
};
function createRoom(roomName,cback) {
    Room.findOne(roomName).exec(function (err, room) {
        if (!room) {
            Room.create({
                name: roomName
            }).exec(function () {
                if(cback){
                    cback();
                }
            })

        }

    });
}
function addUserToRoom(roomName, userName, socket) {
    if (socket) {
        socket.join(roomName);
        socket.broadcast.to(roomName).emit(roomConstants.join,
            {roomName:roomName,userName:userName});
    }
    createRoom(roomName);
    User.findOne(userName).exec(function (err, user) {
        if (user) {
            User.update(userName, {rooms: [roomName]}).exec(function () {
            });
        }
        else {
            User.create({
                name: userName,
                rooms: [roomName]
            }).exec(function () {
            });
        }
    });
    sails.log.info("User "+userName +" has joined room "+roomName);
}
function removeUserFromRoom(roomName, userName, socket) {
    if (socket) {
        socket.leave(roomName);

        socket.broadcast.to(roomName).emit(roomConstants.leave,
            {roomName: roomName, userName: userName});
    }
    User.findOne(userName).exec(function (err, user) {
        if (user&&user.rooms.length <= 1) {
            User.destroy(userName).exec(function () {
            });
        }
    });
    sails.log.info("User "+userName +" has left room "+roomName);
}
function changeContentInDb(roomName,contentId){
    sails.log.info("contentId: "+contentId);
    Room.findOne(roomName).exec(function (err, room) {
        sails.log.info("Room to update");
        sails.log.info(room);
        if (room) {
            Room.update(roomName,
                {
                currentContent: contentId
            }
            ).exec(function (err,updatedRoom) {
                sails.log.info(updatedRoom);
            })
        }

    });
}
function addContent(title,path,uploadedBy,contentType,cback){
    sails.log.info({
        title:title,
        path:path,
        uploadedBy:uploadedBy,
        contentType:contentType
    });
    Content.create({
        title:title,
        path:path,
        uploadedBy:uploadedBy,
        contentType:contentType
    }).exec(function(err,content){
        if(cback)
        {
            cback(content);
        }
    });
}

function likeContent(contentId, cback) {
    Content.findOne(contentId).exec(function(err,content){
        if(err){
            sails.log.error(err);
        }
        content.loves++;
        Content.update(contentId,
            content
        ).exec(function(err,updatedContentItems){
                if(err){
                    sails.log.error(err);
                }
                if(updatedContentItems.length>0){
                    sails.log.info(updatedContentItems[0]);
                    cback(updatedContentItems[0])
                }
            });
    })
}
function dislikeContent(contentId, cback) {
    Content.findOne(contentId).exec(function(err,content){
        if(err){
            sails.log.error(err);
        }
        content.hates++;
        Content.update(contentId,
            content
        ).exec(function(err,updatedContentItems){
                if(err){
                    sails.log.error(err);
                }
                if(updatedContentItems.length>0){
                    sails.log.info(updatedContentItems[0]);
                    cback(updatedContentItems[0])
                }
            });
    })
}
