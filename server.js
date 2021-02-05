const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server, {
  cors: {
    origin: "https://online-chat343.herokuapp.com",
    // credentials: true,
    methods: ["GET", "POST"]
  }
})

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'Online Chat Bot'

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room)

    socket.join(user.room)
    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Chatga xush kelibsiz !'))

    // Broadcast when a user connects
    socket
      .to(user.room)
      .broadcast
      .emit(
        'message',
        formatMessage(botName, `${user.username} chatga qo'shildi`)
        )
       

        // Send Users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        })
  })

  // Listen for chatMessage 
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} chatni tark etdi`)
      )
    
      // Send Users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    }
  })

})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on ${PORT} port`))