var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static("public/"));
app.use(express.static(__dirname));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var roomId = 0;
app.get('/:room', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
    console.log('Page loaded with ID '+roomId);
    if(req.params.room)
        roomId = req.params.room;
});
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.join(roomId);
    var username;
    socket.on('new user',function(name){
        username = name;
        console.log(name+" has connected");
        io.to(roomId).emit('system log',username+" has connected.")
    })
    socket.on('disconnect', function () {
        console.log(username+' disconnected');
        io.to(roomId).emit('system log',username+" disconnected.")
    });
    socket.on('chat message',function(msg){
        console.log("Message: "+msg);
        io.to(roomId).emit('chat message','<b>'+username+'</b>: '+msg);
    });
    socket.on('typing',function(name){
        io.to(roomId).emit('system event',name);
    })
    socket.on('not typing',function(name){
        io.to(roomId).emit('not typing',name);
    })
});
http.listen(port, function () {
    console.log('listening on port:'+port);
});