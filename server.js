const app = require('express')();
const { instrument } = require("@socket.io/admin-ui");
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    serveClient: false,
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(io, {
    auth: {
        type: "basic",
        username: "admin",
        password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
    },
});

const uuid = require('uuid').v4;
const validate = require('uuid').validate;
const xss = require('xss');

app.get('/', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/index.html');
});
app.get('/public/', (req, res) => {
    res.status(200).redirect('/');
});
app.get('/private/', (req, res) => {
    res.status(200).redirect('/');
});

app.get('/public/:name/c/:color', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/public.html');
});
app.get('/private/:name/c/:color', (req, res) => {
    res.status(200).redirect(`/${uuid()}/${req.params.name}/c/${req.params.color}`);
});

app.get('/:room', (req, res) => {
    if (req.params.room == 'public' || !validate(req.params.room)) {
        res.status(200).redirect('/');
    } else {
        res.status(200).sendFile(__dirname + '/public/getusername.html');
    }
});

app.get('/:room/:name/c/:color', (req, res) => {
    if (req.params.room == 'public') {
        res.status(200).redirect(`/public/${req.params.name}/c/${req.params.color}`);
    } else if (!validate(req.params.room)) {
        res.status(200).redirect('/');
    } else {
        res.status(200).sendFile(__dirname + '/public/private.html');
    }
});

app.get('/css/style', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/css/style.css');
});
app.get('/css/page', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/css/page.css');
});

app.get('*', (req, res) => {
    res.status(200).redirect('/');
});

io.on('connection', (socket) => {
    socket.on('publicUser', (username, color) => {
        socket.username = username;
        socket.color = `#${color}`;
        socket.room = 'public';
        socket.join('public');
    });
    socket.on('privateUser', (username, color, room) => {
        socket.username = username;
        socket.color = `#${color}`;
        socket.room = room;
        socket.join(room);
    });
    socket.on('sendMessage', (msg) => {
        io.to(socket.room).emit('getMessage', socket.username, socket.color, xss(msg), socket.id);
    });
});
const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log("SERVER STARTED");
});