var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var exec = require('child_process').exec;
var Q = require('q');
var bodyParser = require('body-parser');
var randomstring = require('just.randomstring');

app.use(bodyParser.urlencoded({extended: false}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var roomId = 0;

app.get("/", function (req, res) {
    var rs = randomstring(8);
    //console.log(rs);
    //res.send(rs);
    res.redirect(307, "/" + rs);
});
app.get('/:room', function (req, res) {
    console.log('Page loaded with ID ' + roomId);
    res.sendFile(__dirname + '/public/index.html');
    if (req.params.room) {
        if (req.params.room != "favicon.ico") {
            roomId = req.params.room;
        }
    }
});

//FOR API Execution
app.post('/code', function (req, res) {
    //console.log(req);

    //res.send(decodeURIComponent(req.body.code));
    //var code = JSON.parse(req.body);
    var code = decodeURIComponent(req.body.code);
    //console.log(req.body);
    var dir = ".\\compiled";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    var filename = new Date().getTime();
    var filename_ext = filename + ".c";
    var filename_out = filename;
    var path = ".\\compiled\\" + filename_ext;
    var command = "gcc " + path + " -o .\\compiled\\" + filename_out;
    var path_out = ".\\compiled\\" + filename_out;
    var delete_command = "rm " + path;
    var delete_command_out = "rm " + path_out;
    fs.writeFile(path, code, function (err) {
        //var deferred = Q.defer();
        if (err) {
            return console.log(err);
        }
        exec(command, function (error, stdout, stderr) {
            if (error) {
                console.error(error);
                //res.send("Compilation failed.\n");
            }
            if (stderr) {
                console.error(stderr);
                res.send(stderr);
            }
            if (stdout) {
                console.log(stdout);
                res.send(stdout);
            }
            else {
                exec(path_out, function (error, stdout, stderr) {
                    if (error) {
                        console.error(error);
                        //res.send("Execution failed.");
                    }
                    else if (stderr) {
                        console.error(stderr);
                        res.send(stderr);
                    }
                    else {
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
    socket.on('code submission', function (codejson) {

        var dir = ".\\compiled";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        var code = codejson.code;
        var args = codejson.args.trim();
        var input = codejson.input.trim();

        args = (args.length > 0) ? " " + args : "";

        //console.log(code);
        var filename = new Date().getTime();
        var filename_ext = filename + ".c";
        var filename_out = filename;
        var path = ".\\compiled\\" + filename_ext;
        var path_out = ".\\compiled\\" + filename;
        var inputFilePath = path_out + ".txt";
        var dexecCommand = "dexec -C " + path + " < " + inputFilePath;
        var localCommand = dexecCommand || "gcc " + path + " -std=c99 -o " + path_out;

        var inputCommand = (input.length > 0) ? " < " + inputFilePath : "";
        var localExec = path_out + args + inputCommand;
        console.log("LE", localExec);

        fs.writeFile(path, code, function (err) {
            if (err) {
                return console.log("Write err", err);
            }
            exec(localCommand, function (error, stdout, stderr) {
                if (stderr) {
                    console.error("Command 1 stderr", stderr);
                    io.to(roomId).emit("shell output", stderr);
                }
                else if (error) {
                    console.error("Command 1 err", error);
                    io.to(roomId).emit("shell output", "Compilation failed.\n");
                }
                else if (stdout) {
                    console.log(stdout);
                    io.to(roomId).emit("shell output", stdout);
                }
                else {
                    fs.writeFile(inputFilePath, input, function (err) {
                        if (err) {
                            return console.log("File Write 2 err", err);
                        }
                        exec(localExec, function (error, stdout, stderr) {
                            if (stderr) {
                                console.error("Command 2 stderr", stderr);
                                io.to(roomId).emit("shell output", stderr);
                            }
                            else if (error) {
                                console.error("Command 2 err", error);
                                io.to(roomId).emit("shell output", "Execution failed.");
                            }
                            else {
                                //success
                                console.log(stdout);
                                io.to(roomId).emit("shell output", stdout);
                            }
                        });
                    });
                }
            });
        });
    });
});

app.use(express.static("public/"));
app.use(express.static(__dirname));
http.listen(port, '0.0.0.0', function () {
    console.log('listening on port:' + port);
});