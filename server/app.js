var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var storyParts = [];

var mongoose = require('mongoose');
var Word = require('./Model/word');

const dbMongo = 'mongodb://localhost:27017/dbStory';
const port = 8585;

var currentWord = '';

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(dbMongo, function(err, params) {
    if (err) {
        console.log(`Error al conectarse a la db ${err}`);
    } else {
        console.log(`Exito al conectarse a la db`);
    }
});

server.listen(port, function() {
    console.log(`Corriendo por el puerto ${port}`);
})

app.post('/api/setWord', function(req, res){
    let word = new Word();
    word.word = req.param('inputWord');
    word.save(function(err, storeWord){
        if (err) {
            res.status(500);
            res.send({message: `error al guardar ${err}`});
        } else {
            res.status(200);
            res.redirect('/');
            res.end();
        }
    });
});

function randomWord(callback){
    Word.find({}, function(err, words){
        var number = Math.floor(Math.random() * words.length);
        currentWord = words[number].word;
        callback(0, currentWord);
    });
}

io.on('connection', function(socket){
    console.log('Alguien está conectado con sockets');
    socket.emit('story', storyParts.storyParts);
    socket.emit('new-word', currentWord);
    socket.on('sent-story', function(data){
        storyParts.push(data);
        io.sockets.emit('story', storyParts);
        randomWord(function(err, data){
            io.emit('new-word', data);
        });
    });
});
