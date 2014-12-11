/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var roomConstants = {
    join: 'roomJoinEvent',
    leave: 'roomLeaveEvent'
};
module.exports = {

    join: function (req, res) {
        //TODO:addUserToRoom
        var joinRequest = req.body,
            socket = req.socket;
        if (socket) {
            socket.join(joinRequest.room);

            socket.broadcast.to(joinRequest.room).emit(roomConstants.join,
                joinRequest);
        }
        Room.findOne(joinRequest.name).exec(function (err, room) {
            if (!room) {
                Room.create({
                    name: joinRequest.room

                }).exec(function () {
                })

            }

        });
        User.findOne(joinRequest.name).exec(function (err, user) {
            if (user) {
                User.update(joinRequest.name, {rooms: [joinRequest.room]}).exec(function () {
                });
            }
            else {
                User.create({
                    name: joinRequest.name,
                    rooms: [joinRequest.room]
                }).exec(function () {
                });
            }
        });

        removeUserFromRoom(joinRequest.room, joinRequest.userName, socket);
//sails.log.info(User);
        //TODO:watch for the socket event that the user leaves and call removeUserFromRoom

    },
    leave: function (req, res) {
        //TODO:removeUserFromRoom
        var joinRequest = req.body,
            socket = req.socket;
        if (socket) {
            socket.leave(joinRequest.room);

        }
        removeUserFromRoom(joinRequest.room, joinRequest.userName, socket);
//2 verschillen!!!! Models is voor database en de functie die je aanmaakt zoals join dit kan je direct aanspreken

    }
};
function addUserToRoom(room, user) {

}
function removeUserFromRoom(roomName, userName, socket) {
    if (socket) {
        socket.on("disconnect", function () {
            socket.join(roomName);

            socket.broadcast.to(roomName).emit(roomConstants.join,
                {roomname: roomName, username: userName});
        });
    }
    User.findOne(userName).exec(function (err, user) {

        if (user&&user.rooms.length <= 1) {
            User.destroy(userName).exec(function () {
            });
        }
    });
}
