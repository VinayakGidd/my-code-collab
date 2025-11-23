// import express, { Response, Request } from "express"
// import dotenv from "dotenv"
// import http from "http"
// import cors from "cors"
// import { SocketEvent, SocketId } from "./types/socket"
// import { USER_CONNECTION_STATUS, User } from "./types/user"
// import { Server } from "socket.io"
// import path from "path"


// import chatbotRoutes from './routes/chatbot';

// dotenv.config()

// const app = express()

// app.use(express.json())

// app.use(cors())

// app.use(express.static(path.join(__dirname, "public"))) // Serve static files



// app.use('/api/chatbot', chatbotRoutes);

// const server = http.createServer(app)
// const io = new Server(server, {
// 	cors: {
// 		origin: "*",
// 	},
// 	maxHttpBufferSize: 1e8,
// 	pingTimeout: 60000,
// })

// let userSocketMap: User[] = []

// // Function to get all users in a room
// function getUsersInRoom(roomId: string): User[] {
// 	return userSocketMap.filter((user) => user.roomId == roomId)
// }

// // Function to get room id by socket id
// function getRoomId(socketId: SocketId): string | null {
// 	const roomId = userSocketMap.find(
// 		(user) => user.socketId === socketId
// 	)?.roomId

// 	if (!roomId) {
// 		console.error("Room ID is undefined for socket ID:", socketId)
// 		return null
// 	}
// 	return roomId
// }

// function getUserBySocketId(socketId: SocketId): User | null {
// 	const user = userSocketMap.find((user) => user.socketId === socketId)
// 	if (!user) {
// 		console.error("User not found for socket ID:", socketId)
// 		return null
// 	}
// 	return user
// }

// io.on("connection", (socket) => {
// 	// Handle user actions
// 	socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
// 		// Check is username exist in the room
// 		const isUsernameExist = getUsersInRoom(roomId).filter(
// 			(u) => u.username === username
// 		)
// 		if (isUsernameExist.length > 0) {
// 			io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS)
// 			return
// 		}

// 		const user = {
// 			username,
// 			roomId,
// 			status: USER_CONNECTION_STATUS.ONLINE,
// 			cursorPosition: 0,
// 			typing: false,
// 			socketId: socket.id,
// 			currentFile: null,
// 		}
// 		userSocketMap.push(user)
// 		socket.join(roomId)
// 		socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user })
// 		const users = getUsersInRoom(roomId)
// 		io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users })
// 	})

// 	socket.on("disconnecting", () => {
// 		const user = getUserBySocketId(socket.id)
// 		if (!user) return
// 		const roomId = user.roomId
// 		socket.broadcast
// 			.to(roomId)
// 			.emit(SocketEvent.USER_DISCONNECTED, { user })
// 		userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id)
// 		socket.leave(roomId)
// 	})

// 	// Handle file actions
// 	socket.on(
// 		SocketEvent.SYNC_FILE_STRUCTURE,
// 		({ fileStructure, openFiles, activeFile, socketId }) => {
// 			io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
// 				fileStructure,
// 				openFiles,
// 				activeFile,
// 			})
// 		}
// 	)

// 	socket.on(
// 		SocketEvent.DIRECTORY_CREATED,
// 		({ parentDirId, newDirectory }) => {
// 			const roomId = getRoomId(socket.id)
// 			if (!roomId) return
// 			socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, {
// 				parentDirId,
// 				newDirectory,
// 			})
// 		}
// 	)

// 	socket.on(SocketEvent.DIRECTORY_UPDATED, ({ dirId, children }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, {
// 			dirId,
// 			children,
// 		})
// 	})

// 	socket.on(SocketEvent.DIRECTORY_RENAMED, ({ dirId, newName }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, {
// 			dirId,
// 			newName,
// 		})
// 	})

// 	socket.on(SocketEvent.DIRECTORY_DELETED, ({ dirId }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast
// 			.to(roomId)
// 			.emit(SocketEvent.DIRECTORY_DELETED, { dirId })
// 	})

// 	socket.on(SocketEvent.FILE_CREATED, ({ parentDirId, newFile }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast
// 			.to(roomId)
// 			.emit(SocketEvent.FILE_CREATED, { parentDirId, newFile })
// 	})

// 	socket.on(SocketEvent.FILE_UPDATED, ({ fileId, newContent }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
// 			fileId,
// 			newContent,
// 		})
// 	})

// 	socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
// 			fileId,
// 			newName,
// 		})
// 	})

// 	socket.on(SocketEvent.FILE_DELETED, ({ fileId }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId })
// 	})

// 	// Handle user status
// 	socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
// 		userSocketMap = userSocketMap.map((user) => {
// 			if (user.socketId === socketId) {
// 				return { ...user, status: USER_CONNECTION_STATUS.OFFLINE }
// 			}
// 			return user
// 		})
// 		const roomId = getRoomId(socketId)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId })
// 	})

// 	socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
// 		userSocketMap = userSocketMap.map((user) => {
// 			if (user.socketId === socketId) {
// 				return { ...user, status: USER_CONNECTION_STATUS.ONLINE }
// 			}
// 			return user
// 		})
// 		const roomId = getRoomId(socketId)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId })
// 	})

// 	// Handle chat actions
// 	socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast
// 			.to(roomId)
// 			.emit(SocketEvent.RECEIVE_MESSAGE, { message })
// 	})

// 	// Handle cursor position
// 	socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
// 		userSocketMap = userSocketMap.map((user) => {
// 			if (user.socketId === socket.id) {
// 				return { ...user, typing: true, cursorPosition }
// 			}
// 			return user
// 		})
// 		const user = getUserBySocketId(socket.id)
// 		if (!user) return
// 		const roomId = user.roomId
// 		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user })
// 	})

// 	socket.on(SocketEvent.TYPING_PAUSE, () => {
// 		userSocketMap = userSocketMap.map((user) => {
// 			if (user.socketId === socket.id) {
// 				return { ...user, typing: false }
// 			}
// 			return user
// 		})
// 		const user = getUserBySocketId(socket.id)
// 		if (!user) return
// 		const roomId = user.roomId
// 		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user })
// 	})

// 	socket.on(SocketEvent.REQUEST_DRAWING, () => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast
// 			.to(roomId)
// 			.emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id })
// 	})

// 	socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
// 		socket.broadcast
// 			.to(socketId)
// 			.emit(SocketEvent.SYNC_DRAWING, { drawingData })
// 	})

// 	socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) => {
// 		const roomId = getRoomId(socket.id)
// 		if (!roomId) return
// 		socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, {
// 			snapshot,
// 		})
// 	})
// })

// const PORT = process.env.PORT || 3000

// app.get("/", (req: Request, res: Response) => {
// 	// Send the index.html file
// 	res.sendFile(path.join(__dirname, "..", "public", "index.html"))
// })

// server.listen(PORT, () => {
// 	console.log(`Listening on port ${PORT}`)
// })




import express, { Response, Request } from "express"
import dotenv from "dotenv"
import http from "http"
import cors from "cors"
import { SocketEvent, SocketId } from "./types/socket"
import { USER_CONNECTION_STATUS, User } from "./types/user"
import { Server } from "socket.io"
import path from "path"
import mongoose from "mongoose" // Import Mongoose

import chatbotRoutes from './routes/chatbot';

dotenv.config()

// --- DATABASE CONFIGURATION ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/codecollab";

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// --- DATABASE SCHEMA ---
// We store individual files mapped to a room and their specific file ID
const FileSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    fileId: { type: String, required: true },
    content: { type: String, default: "" }
});

// Compound index to ensure a fileId is unique within a room
FileSchema.index({ roomId: 1, fileId: 1 }, { unique: true });

const FileModel = mongoose.model("File", FileSchema);

// --- EXPRESS CONFIGURATION ---
const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, "public")))

app.use('/api/chatbot', chatbotRoutes);

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
})

let userSocketMap: User[] = []

// --- HELPER FUNCTIONS ---
function getUsersInRoom(roomId: string): User[] {
    return userSocketMap.filter((user) => user.roomId == roomId)
}

function getRoomId(socketId: SocketId): string | null {
    const roomId = userSocketMap.find(
        (user) => user.socketId === socketId
    )?.roomId

    if (!roomId) {
        console.error("Room ID is undefined for socket ID:", socketId)
        return null
    }
    return roomId
}

function getUserBySocketId(socketId: SocketId): User | null {
    const user = userSocketMap.find((user) => user.socketId === socketId)
    if (!user) {
        console.error("User not found for socket ID:", socketId)
        return null
    }
    return user
}

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
    
    // 1. HANDLE USER JOINING (Updated with DB Load)
    socket.on(SocketEvent.JOIN_REQUEST, async ({ roomId, username }) => {
        // Check if username exists in the room
        const isUsernameExist = getUsersInRoom(roomId).filter(
            (u) => u.username === username
        )
        if (isUsernameExist.length > 0) {
            io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS)
            return
        }

        const user = {
            username,
            roomId,
            status: USER_CONNECTION_STATUS.ONLINE,
            cursorPosition: 0,
            typing: false,
            socketId: socket.id,
            currentFile: null,
        }
        
        userSocketMap.push(user)
        socket.join(roomId)
        
        // Broadcast to others that user joined
        socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user })
        
        const users = getUsersInRoom(roomId)

        // --- DB INTEGRATION: FETCH SAVED FILES ---
        try {
            const storedFiles = await FileModel.find({ roomId });
            // Create a dictionary of fileId -> content to send to client
            const fileContents: Record<string, string> = {};
            storedFiles.forEach(file => {
                fileContents[file.fileId] = file.content;
            });

            // Send acceptance + loaded file contents
            io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users, fileContents })
        } catch (error) {
            console.error("Error loading files from DB:", error);
            // Fallback if DB fails
            io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users, fileContents: {} })
        }
    })

    socket.on("disconnecting", () => {
        const user = getUserBySocketId(socket.id)
        if (!user) return
        const roomId = user.roomId
        socket.broadcast
            .to(roomId)
            .emit(SocketEvent.USER_DISCONNECTED, { user })
        userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id)
        socket.leave(roomId)
    })

    // Handle file structure sync (Peer-to-peer sync)
    socket.on(
        SocketEvent.SYNC_FILE_STRUCTURE,
        ({ fileStructure, openFiles, activeFile, socketId }) => {
            io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
                fileStructure,
                openFiles,
                activeFile,
            })
        }
    )

    // --- DIRECTORY EVENTS (Broadcasting only) ---
    // Note: To persist folder structure perfectly, you'd need a separate DirectoryModel.
    // For now, we focus on persisting file *content* so code isn't lost.
    
    socket.on(SocketEvent.DIRECTORY_CREATED, ({ parentDirId, newDirectory }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, {
            parentDirId,
            newDirectory,
        })
    })

    socket.on(SocketEvent.DIRECTORY_UPDATED, ({ dirId, children }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, {
            dirId,
            children,
        })
    })

    socket.on(SocketEvent.DIRECTORY_RENAMED, ({ dirId, newName }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, {
            dirId,
            newName,
        })
    })

    socket.on(SocketEvent.DIRECTORY_DELETED, ({ dirId }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast
            .to(roomId)
            .emit(SocketEvent.DIRECTORY_DELETED, { dirId })
    })

    // --- FILE EVENTS (Updated with DB Persistence) ---

    socket.on(SocketEvent.FILE_CREATED, async ({ parentDirId, newFile }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        
        // Broadcast
        socket.broadcast
            .to(roomId)
            .emit(SocketEvent.FILE_CREATED, { parentDirId, newFile })

        // Save initial empty file to DB
        try {
             await FileModel.create({
                roomId,
                fileId: newFile.id, // Assuming newFile object has an 'id' property
                content: ""
            });
        } catch (error) {
            console.error("Error creating file in DB:", error);
        }
    })

    socket.on(SocketEvent.FILE_UPDATED, async ({ fileId, newContent }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        
        // Broadcast
        socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
            fileId,
            newContent,
        })

        // Save content to DB
        try {
            await FileModel.findOneAndUpdate(
                { roomId, fileId },
                { content: newContent },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error("Error saving file content to DB:", error);
        }
    })

    socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
            fileId,
            newName,
        })
        // Note: We don't store filename in FileModel in this simple schema, 
        // only content map. Filenames live in the peer-synced file structure.
    })

    socket.on(SocketEvent.FILE_DELETED, async ({ fileId }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        
        // Broadcast
        socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId })

        // Remove from DB
        try {
            await FileModel.findOneAndDelete({ roomId, fileId });
        } catch (error) {
            console.error("Error deleting file from DB:", error);
        }
    })

    // --- USER STATUS & CHAT (Keep existing logic) ---

    socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
        userSocketMap = userSocketMap.map((user) => {
            if (user.socketId === socketId) {
                return { ...user, status: USER_CONNECTION_STATUS.OFFLINE }
            }
            return user
        })
        const roomId = getRoomId(socketId)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId })
    })

    socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
        userSocketMap = userSocketMap.map((user) => {
            if (user.socketId === socketId) {
                return { ...user, status: USER_CONNECTION_STATUS.ONLINE }
            }
            return user
        })
        const roomId = getRoomId(socketId)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId })
    })

    socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast
            .to(roomId)
            .emit(SocketEvent.RECEIVE_MESSAGE, { message })
    })

    socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
        userSocketMap = userSocketMap.map((user) => {
            if (user.socketId === socket.id) {
                return { ...user, typing: true, cursorPosition }
            }
            return user
        })
        const user = getUserBySocketId(socket.id)
        if (!user) return
        const roomId = user.roomId
        socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user })
    })

    socket.on(SocketEvent.TYPING_PAUSE, () => {
        userSocketMap = userSocketMap.map((user) => {
            if (user.socketId === socket.id) {
                return { ...user, typing: false }
            }
            return user
        })
        const user = getUserBySocketId(socket.id)
        if (!user) return
        const roomId = user.roomId
        socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user })
    })

    socket.on(SocketEvent.REQUEST_DRAWING, () => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast
            .to(roomId)
            .emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id })
    })

    socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
        socket.broadcast
            .to(socketId)
            .emit(SocketEvent.SYNC_DRAWING, { drawingData })
    })

    socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) => {
        const roomId = getRoomId(socket.id)
        if (!roomId) return
        socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, {
            snapshot,
        })
    })
})



const PORT = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"))
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})