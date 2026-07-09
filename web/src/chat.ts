import { connect } from "socket.io-client";
import { get, writable, type Writable } from "svelte/store";
import { connects, sendOffer, sendAnswer, setAnswer, setOffer } from "./webrtc";

export const roomName: Writable<null | string> = writable(null);

export const userName = writable("");

export const chatMembers: Writable<string[]> = writable([]);

export type ChatMessage = { user: string; type: "chat"; message: string };

export const chatMessages: Writable<ChatMessage[]> = writable([]);

const socket = connect("http://localhost:8080");

let connected = false;

const timeout = 3000;

export function createOrJoinRoom(name: string) {
    return new Promise((resolve,reject) =>{
        let timer:null|NodeJS.Timeout = null;
        if(!connected){
            reject("not connected");
        }

        socket.emit("create or join", name);

        socket.once("full",(room:string) => {
            if (timer) clearTimeout(timer);
            reject(`room${room}is full`);
        });

        socket.once("created",()=>{
            if (timer) clearTimeout(timer);
            roomName.set(name);
            resolve("created");
        });
        socket.once("joined",async(members:string[]) =>{
            if (timer)clearTimeout(timer);
            for(const member of members){
                await sendOffer(newPeerConnection, member ,sendSdp);
            }

            resolve("joined");
        });
        
        timer = setTimeout(()=>{
            reject("timeout waiting for server respponse");
        },timeout);
        
    });
}

export function sendMessage(message: ChatMessage) {
    throw new Error("Not implemented");
}

function getPeer(to: string): RTCPeerConnection {
    return connects.get(to)!.chatConnection!;
}

function newPeerConnection(to: string): RTCPeerConnection {
    const peer= new RTCPeerConnection();
    peer.onconnectionstatechange = (_) => {
        console.log(`connection state change: ${peer.connectionState}`);
        if (peer.connectionState === "disconnected"){
            chatMembers.update((members) => [...members, to]);
        }else if(
            peer.connectionState === "disconnected" ||
            peer.connectionState === "failed" ||
            peer.connectionState === "closed"
        ){
            chatMembers.update((members) =>
                members.filter((member) => member !== to)
        );

    };
    peer.ondatachannel = (ev) => {
        const{ chatConnection } = connects.get(to)!;
        connects.set(to,{
            chatConnection,
            chatChannel: ev.channel,
        });
    };
    const chatChannel = peer.createDataChannel("chat");
    chatChannel.onmessage = (ev) => {
        const message: ChatMessage = JSON.parse(ev.data);
        console.log(message);
        chatMessages.update((messages) => {
            return [...messages, message];
        });
    };
    peer.onicecandidate = (ev) => {
        if(ev.candidate){
            console.log(ev.candidate);
            sendCandidate(ev.candidate,to,socket.id)

        };
    };
    connects.set(to, {
        chatConnection: peer,
        chatChannel,
    });
    return peer;
}


function sendSdp(
    type: "offer" | "answer",
    sdp: RTCSessionDescription,
    to: string,
    from: string
) {
    socket.emit(type, get(roomName), to, from, JSON.stringify(sdp));
}

function sendCandidate(candidate: RTCIceCandidate, to: string, from: string) {
    throw new Error("Not implemented");
}

socket.on("connect", () => {});
