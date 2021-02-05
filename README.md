# **Among us - Teaching**

## **Introduction**

Among us - Teaching is a project that aims to offer a fun way to prepare for an exam. This tool is designed to be used by teachers, allowing them create "tasks" by pairing a subject and a code. Those tasks will be used in the same way they are in Among Us (https://innersloth.com/gameAmongUs.php). The game cycle is simple:
(1) First, players take note of their role. Next, they will assigned tasks, each of which require a code to be completed, this code is obtained by completing the linked exercise (modular depending on the teacher). Tasks completed by the crewmates will fill a gauge, and crewmates win when the gauge is filled. The Impostors' must kill a targeted crewmate. At X code (will be configurable) the meeting button will show up. Meeting can be activated by anyone and will create a text chat to discuss  and show who has been killed. A vote will be initiated to eject one of the players. If task progress reaches 100% or if there's no impostors left, crewmates win. Otherwise, if there's an equal number of impostors and crewmates, impostors win.

## **Technical part**
This project is still in early development, a lot of things may change and/or are missing. The backend part is based on a NodeJS server using [Socket.io](https://socket.io/) and [Fastity](https://www.fastify.io/) offering an API and a Websocket server.

### **API Reference**

| path              | description                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `/api/createRoom` | Create a room inside the server, will respond with the roomId : `{roomId: string}` |

### **Socket signals**

| signal          | side (from who) | description                                                                                                                  | payload                                                                  | possible returns signals                               |
|-----------------|-----------------|------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| `joinRoom`      | Client          | Connect the client (mapped by socket id) to the asked room.                                                                  | `{roomId: string, name: string}`                                         | `successJoin`, `error`                                 |
| `startGame`     | Client          | Start the game of the current client socket, if the socket isn't admin it will send an error.                                | `{tasksType: string}`                                                    | `gameStart`, `error`                                   |
| `taskCode`      | Client          | Input a task code, send a success or a failure either the code is valid or not.                                              | `{taskID: string, code: string}`                                         | `successTask`, `failedTask`, `error`                   |
| `meetingButton` | Client          | Ask for the game to start a meeting, if the amount of codes received is under the minimum it will send an error.             | `{}`                                                                     | `startMeeting` (and later on `ejecting`, `endMeeting`) |
| `disconnect`    | Client          | Disconnect from the socket server, will remove player from the room he was connected to.                                     | `{}`                                                                     |                                                        |
|                 |                 |                                                                                                                              |                                                                          |                                                        |
| `error`         | Server          | Send an error to the socket, can be emit from multiple sources.                                                              | `{errType: string, message: string}`                                     |                                                        |
| `gameStart`     | Server          | Result of `startGame`, assign roles and tasks to each player. (sent one by one to players)                                   | `{gamestate: string, role: string, task: @server/src/types}`             |                                                        |
| `updatePlayers` | Server          | Send an up-to-date players list. Some payload's attributes are conditionnal of the source. (eg. alive is only on meeting).   | `{id: string, name: string, admin?: boolean, alive?: boolean}[]`         |                                                        |
| `successJoin`   | Server          | Response of `joinRoom` signal, give basic game info of the lobby.                                                            | `{gamestate: string, players: @updatePlayers[], player: @updatePlayers}` |                                                        |
| `feedTask`      | Server          | Broadcastly emited, sent whenever a player input a code (good or wrong).                                                     | `{playerName: string, date: Date}`                                       |                                                        |
| `successTask`   | Server          | Positive response of `taskCode`. Contains the taskID that has been completed.                                                | `{taskID: string}`                                                       |                                                        |
| `failedTask`    | Server          | Negative response of `taskCode`. Contains the taskID that has been failed.                                                   | `{taskID: string}`                                                       |                                                        |
| `killed`        | Server          | `:(` emitted to the killed target.                                                                                           | `{killer: {name: string, id: string}}`                                   |                                                        |
| `startMeeting`  | Server          | Start meeting phase, response to `meetingButton`. Send playerlist with their life state.                                     | `{gamestate: string, players: @updatePlayers[]}`                         |                                                        |
| `ejecting`      | Server          | At the end of the vote phase, send the vote results (which is a map of (key) player and (value) players that voted for him). | `{gamestate: string, votes: Object.<string, string[]>}`                  |                                                        |
| `endMeeting`    | Server          | Resume gamestate to playing. Following the `ejecting` signal after 5 sec.                                                    | `{gamestate: string}`                                                    |                                                        |
### **Front end**
Front end part is build on [Angular V11](https://angular.io/), using socket.io-client (despite ngx-socket-io angular module does not seem to work).

### **Deployment**
Dockerfiles will generate servers for both the server and the.Server side is a simple node image to run the server, Client side uses of node image to build the Angular app and then copy the result in a Nginx image that will serve those files. A `docker-compose.yml` file at the root combines those two builds and one more Nginx image (with a `nginx.conf` file) to serve all. 

`docker-compose.yml` template :
```yml
version: "3"

services:
        nginx:
                restart: always
                image: nginx:latest
                volumes:
                        - ./nginx.conf:/etc/nginx/nginx.conf
                ports:
                        - 2000:80

        server:
                restart: always
                build: server/
                environment: 
                        - PORT: 2001
                        - CLIENT_ORIGIN: "your.host.example"

        client:
                restart: always
                build: client/
```