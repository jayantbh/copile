var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var exec = require('child_process').exec;
var Q = require('q');
var bodyParser = require('body-parser');

app.use(express.static("public/"));
app.use(express.static(__dirname));
app.use(bodyParser());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var roomId = 0;
app.get('/:room', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
    console.log('Page loaded with ID ' + roomId);
    if (req.params.room) {
        if (req.params.room != "favicon.ico") {
            roomId = req.params.room;
        }
    }
});
app.post('/code', function (req, res) {
    //console.log(req);

    //res.send(decodeURIComponent(req.body.code));
    //var code = JSON.parse(req.body);
    code = decodeURIComponent(req.body.code);
    //console.log(req.body);

    var filename = new Date().getTime();
    var filename_ext = filename + ".c";
    var filename_out = filename;
    var path = "./compiled/" + filename_ext;
    var command = "gcc " + path + " -o ./compiled/" + filename_out;
    var path_out = "./compiled/" + filename_out;
    var delete_command = "rm "+path;
    var delete_command_out = "rm "+path_out;
    fs.writeFile(path, code, function (err) {
        //var deferred = Q.defer();
        if (err) {
            return console.log(err);
        }
        exec(command, function (error, stdout, stderr) {
            if(error){
                console.error(error);
                //res.send("Compilation failed.\n");
            }
            if(stderr){
                console.error(stderr);
                res.send(stderr);
            }
            if(stdout){
                console.log(stdout);
                res.send(stdout);
            }
            else{
                exec(path_out, function (error, stdout, stderr) {
                    if(error){
                        console.error(error);
                        //res.send("Execution failed.");
                    }
                    else if(stderr){
                        console.error(stderr);
                        res.send(stderr);
                    }
                    else{
                        //success
                        console.log(stdout);
                        res.send(stdout);
                    }
                });
            }
        });
    });

});

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.join(roomId);
    socket.on('code submission', function (code) {

        //console.log(code);
        var filename = new Date().getTime();
        var filename_ext = filename + ".c";
        var filename_out = filename;
        var path = "./compiled/" + filename_ext;
        var command = "gcc " + path + " -o ./compiled/" + filename_out;
        var path_out = "./compiled/" + filename_out;
        var delete_command = "rm "+path;
        var delete_command_out = "rm "+path_out;
        fs.writeFile(path, code, function (err) {
            //var deferred = Q.defer();
            if (err) {
                return console.log(err);
            }
            exec(command, function (error, stdout, stderr) {
                if(error){
                    console.error(error);
                    io.to(roomId).emit("shell output","Compilation failed.\n");
                }
                if(stderr){
                    console.error(stderr);
                    io.to(roomId).emit("shell output",stderr);
                }
                if(stdout){
                    console.log(stdout);
                    io.to(roomId).emit("shell output",stdout);
                }
                else{
                    exec(path_out, function (error, stdout, stderr) {
                        if(error){
                            console.error(error);
                            //io.to(roomId).emit("shell output","Execution failed.");
                        }
                        else if(stderr){
                            console.error(stderr);
                            io.to(roomId).emit("shell output",stderr);
                        }
                        else{
                            //success
                            console.log(stdout);
                            io.to(roomId).emit("shell output",stdout);
                        }
                    });
                }
            });
        });
    });
});
http.listen(port, '0.0.0.0', function () {
    console.log('listening on port:' + port);
});