var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Moniker = require('moniker');

http.listen(3000, function() {
    console.log('listening on *:3000');
});

var luckyNumber = randNumber();
var users = [];

var addUser = function() {
    var user = {
        name: Moniker.choose(),
        lastGuess: null
    }
    users.push(user);
    updateUsers();
    return user;
}
var removeUser = function(user) {
    for (let i = 0; i < users.length; i++) {
        if (user.name === users[i].name) {
            users.splice(i, 1);
            updateUsers();
            return;
        }
    }
}
var updateUsers = function() {
    var str = '';
    for (let i = 0; i < users.length; i++) {
        var user = users[i];
        str += user.name + ' <small>(last guess: ' + user.lastGuess + ')</small><br>';
    }
    io.sockets.emit('users', { users: str });
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html');
});

function randNumber() {
    const luckyNumber = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
    console.log('lucky number is ' + luckyNumber);
    return luckyNumber;
}

function updateNumber() {
    luckyNumber = randNumber();
}

io.on('connection', function(socket) {
    console.log('a user connected');
    var user = addUser();
    socket.emit('welcome', user);


    socket.on('disconnect', function() {
        console.log('user disconnected');
        removeUser(user);
    });

    socket.on('guess', function(number) {
        number = parseInt(number);
        console.log(user.name + ' guessed ' + number);
        user.lastGuess = number;
        updateUsers();
        if (number === luckyNumber) {
            console.log(user.name + ' guessed the right number');
            io.sockets.emit('victory', { winner: user.name, number: number });
            updateNumber();
        }
    });
});
