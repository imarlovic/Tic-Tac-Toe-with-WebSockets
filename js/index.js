const socket = io();
const $playerUsername = document.getElementById('player-username');
const $playerWins = document.getElementById('player-wins');
const $opponentUsername = document.getElementById('opponent-username');
const $opponentWins = document.getElementById('opponent-wins');
const $modal = document.getElementById('modal');
const $modalWin = document.getElementById('modal-win');
const $modalWinText = document.getElementById('modal-win-text');
const $usernameInput = document.getElementById('username-input');
const $playButton = document.getElementById('play-button');
var fields = document.getElementsByClassName('field');
var Game = null;

$usernameInput.value = "";

if(!window.WebSocket){
    let $container = document.getElementsByClassName('container')[0];
    $container.innerHTML = "";
    $container.style.animation = "";
    $container.style.backgroundColor = "red";
    $modal.classList.add('hidden');
    $modalWinText.innerText = "Please use a browser with WebSocket support.";
    $modalWin.id = 'modal-error';
    $modalWin.classList.remove('hidden');
}

class GameEngine {
    constructor(gameData) {
        this.opponent = gameData.opponent;
        this.gameid = gameData.gameid;
        this.sign = gameData.sign;
        this.lastPlayer = 'o';
        this.fieldsClaimed = 0;
        this.gameModel = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
        this.fields = document.getElementsByClassName('field');
    }

    claimField(event) {
        var clickedField = event.target;

        if (clickedField.innerText == '' && this.lastPlayer != this.sign) {
            let row = parseInt(clickedField.dataset.row);
            let col = parseInt(clickedField.dataset.col);

            socket.emit('game claim field', { gameid: this.gameid, sign: this.sign, row: row, col: col });
        }
    }

    fieldClaimed(data) {
        this.fieldsClaimed++;
        this.lastPlayer = data.sign;
        var clickedField = null;

        this.gameModel[data.row][data.col] = data.sign;

        for (let i in this.fields) {
            let field = this.fields[i];
            if (field.dataset.row == data.row && field.dataset.col == data.col) {
                clickedField = field;
                break;
            }
        }

        clickedField.innerText = data.sign;

        if (this.checkWinner()) {
            if (this.sign == data.sign){
                $modalWinText.innerText = 'You won! :)';
                this.lastPlayer = this.sign;
                this.showWinModal()
            }
            else{
                $modalWinText.innerText = 'You lost :(';
                this.showWinModal()
            }
            this.resetGame();
        }
        else if (this.fieldsClaimed >= 9) {
            $modalWinText.innerText = "It's a draw!";
            this.showWinModal()
            this.resetGame();
        }
    }

    checkWinner() {

        var winnerFound = false; 

        for (let row = 0; row < 3 && !winnerFound; row++) {
            if (this.gameModel[row][0] === this.gameModel[row][1] && this.gameModel[row][1] === this.gameModel[row][2])
                winnerFound = true;
        }

        for (let col = 0; col < 3 && !winnerFound; col++) {
            if (this.gameModel[0][col] === this.gameModel[1][col] && this.gameModel[1][col] === this.gameModel[2][col])
                winnerFound = true;
        }

        if (!winnerFound && this.gameModel[0][0] === this.gameModel[1][1] && this.gameModel[1][1] === this.gameModel[2][2])
            winnerFound = true;

        if (!winnerFound && this.gameModel[0][2] === this.gameModel[1][1] && this.gameModel[1][1] === this.gameModel[2][0])
            winnerFound = true;

        if(winnerFound ){
            if(this.lastPlayer == this.sign)
                $playerWins.innerText = parseInt($playerWins.innerText) + 1;
            else
                $opponentWins.innerText = parseInt($opponentWins.innerText) + 1;
        }

        return winnerFound;
    }

    resetGame() {
        this.fieldsClaimed = 0;
        this.gameModel = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
        for(let i=0; i<this.fields.length; i++) {
            this.fields[i].innerText = '';
        }
    }

    showWinModal(){
        $modalWin.classList.remove('hidden');
        setTimeout(function(){
            $modalWin.classList.add('hidden');
        }, 2000);
    }
}


$playButton.onclick = () => {
    if ($usernameInput.value.length > 0)
        socket.emit('register username', $usernameInput.value);
        $playerUsername.innerText = $usernameInput.value;
        $opponentUsername.innerText = "Waiting for player..."
        $modal.classList.toggle('hidden');
};

socket.on('game init', (gameData) => {
    Game = new GameEngine(gameData);
    for(let i=0; i<this.fields.length; i++){
        Game.fields[i].onclick = Game.claimField.bind(Game);
    }

    $opponentUsername.innerText = gameData.opponent;

    $playerWins.innerText = 0;
    $opponentWins.innerText = 0;
});

socket.on('game field claimed', function(data){
     Game.fieldClaimed(data);
});

socket.on('opponent disconnected', function(){
    Game.resetGame();
    $opponentUsername.innerText = "Waiting for player...";
    $playerWins.innerText = 0;
    $opponentWins.innerText = 0;
});

