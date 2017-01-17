var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var playersWaiting = [];

var activeGames = [];

app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/', express.static(__dirname));

io.on('connection', function(socket){

  socket.on('register username', function(username){

    playersWaiting.push({ socket: this, username: username });

    if(playersWaiting.length > 1){
      let player1 = playersWaiting[0];
      let player2 = playersWaiting[1];

      playersWaiting.splice(0, 2);

      activeGames.push({ gameid: 333, players: [player1, player2] });

      player1.socket.emit('game init', { opponent: player2.username, gameid: 333, sign: 'x' });
      player2.socket.emit('game init', { opponent: player1.username, gameid: 333, sign: 'o' });
    }

  }.bind(socket))

  socket.on('game claim field', function(data){
    let game = activeGames.find(x => x.gameid == data.gameid);

    for(let player of game.players){
      player.socket.emit('game field claimed', { gameid: data.gameid, sign: data.sign, row: data.row, col: data.col });
    }

  });

  socket.on('disconnect', function () {
    let playerIndex = playersWaiting.findIndex(x => x.socket.id == this.id);

    if(playerIndex != -1){
      playersWaiting.splice(playerIndex, 1);
    }

    let gameIndex = activeGames.findIndex(x => x.players.findIndex(x => x.socket.id == this.id) != -1)

    if(gameIndex != -1){
      let activeGame = activeGames[gameIndex];
      let remainingPlayer = activeGame.players.find(x => x.socket.id != this.id);
      remainingPlayer.socket.emit('opponent disconnected');
      playersWaiting.push(remainingPlayer);
      activeGames.splice(gameIndex, 1);
    }

  }.bind(socket));

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
