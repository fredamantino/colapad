const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const connectDB = require('./db'); // Conexão com MongoDB
const Note = require('./models/Note'); // Modelo de Nota

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Conectar ao MongoDB
connectDB();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rotas de API para manipulação de notas
app.post('/api/notes', async (req, res) => {
    const { title, content } = req.body;
    try {
        const newNote = new Note({
            title,
            content,
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

app.get('/api/notes/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get note' });
    }
});

app.put('/api/notes/:id', async (req, res) => {
    const { title, content } = req.body;
    try {
        const note = await Note.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update note' });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Rotas existentes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'note.html'));
});

io.on('connection', (socket) => {
    const notePath = socket.handshake.query.notePath;

    Note.findOne({ title: notePath }).then(note => {
        if (note) {
            socket.emit('loadNote', note.content);
        }
    });

    socket.on('noteChange', (data) => {
        Note.findOneAndUpdate(
            { title: notePath },
            { content: data },
            { new: true, upsert: true }
        ).then(note => {
            socket.broadcast.to(notePath).emit('noteChange', note.content);
        });
    });

    socket.join(notePath);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
