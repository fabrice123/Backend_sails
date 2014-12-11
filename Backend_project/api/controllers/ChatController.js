/**
 * ChatController
 *
 * @description :: Server-side logic for managing chats
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var chatConstants = {
    join: 'chatJoinEvent',
    send: 'chatSendEvent',
    userIsTyping: 'chatUserIsTypingEvent',
    leave: 'chatLeaveEvent'
};
module.exports = {
    join: function (req, resp) {
        var joinRequest = req.body,
            socket = req.socket;
        socket.join(joinRequest.roomName);
        socket.broadcast.to(joinRequest.roomName).emit(chatConstants.join,
            joinRequest);

        sails.log.info(joinRequest);
    },
    send: function (req, resp) {
        var chatRequest = req.body,
            socket = req.socket;
        socket.broadcast.to(chatRequest.roomName).emit(chatConstants.send,
            chatRequest);
        sails.log.info(chatRequest);
    },
    userIsTyping: function (req, resp) {
        var typingRequest = req.body,
            socket = req.socket;
        socket.broadcast.to(typingRequest.roomName).emit(chatConstants.userIsTyping,
            typingRequest);
        sails.log.info(typingRequest);
    },
    leave: function (req, resp) {
        var leaveRequest = req.body,
            socket = req.socket;
        socket.broadcast.to(leaveRequest.roomName).emit(chatConstants.leave,
            leaveRequest);
        sails.sockets.leave(req.socket, leaveRequest.roomName);
        sails.log.info(leaveRequest);
    }
};

