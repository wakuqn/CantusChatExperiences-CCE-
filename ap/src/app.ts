import { Server } from "http";
import { Server as SocketIO } from "socket.io";

const httpServer = new Server();

const io = new SocketIO(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

    const membersMap = new Map<string, string[]> = new Map():

io.on("connection",(socket) => {
    console.log(user connectted: ${socket.id});
    socket.on("disconnect",() => {
        console.log(user disconnected: ${socket.id});
    });
    
    socket.on("create or join",(room:string)=>{
        const lenth = membersMap.get(room)?.length ?? 0;

        if(numMembers === 0){
            socket.join(room);
            membersMap.set(room, [socket.id]);
            socket.emit("created", room);
        }else if (numMembers <7){
            io.sockets.in(room).emit("join",socket.id);
            socket.join(room);
            socket.emit("joined", membersMap.get(room));
            io.sockets.in(room).emit("ready");
        }else{
            socket.emit("full", room);
        }
    });
});

httpServer.listen(8080);


