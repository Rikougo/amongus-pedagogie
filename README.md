# Among us - Teaching

## Introduction

Among us - Teaching is a project that aims to offer a fun way to prepare for an exam. This tool is designed to be used by teachers, allowing them create "tasks" by pairing a subject and a code. Those tasks will be used in the same way they are in Among Us (https://innersloth.com/gameAmongUs.php). The game cycle is simple:
(1) First, players take note of their role. Next, they will assigned tasks, each of which require a code to be completed, this code is obtained by completing the linked exercise (modular depending on the teacher). Tasks completed by the crewmates will fill a gauge, and crewmates win when the gauge is filled. The Impostors' must kill a targeted crewmate. At X code (will be configurable) the meeting button will show up. Meeting can be activated by anyone and will create a text chat to discuss  and show who has been killed. A vote will be initiated to eject one of the players. If task progress reaches 100% or if there's no impostors left, crewmates win. Otherwise, if there's an equal number of impostors and crewmates, impostors win.

## Technical part
This project is still in early development, a lot of things may change and/or are missing. The backend part is based on a NodeJS server using [Socket.io](https://socket.io/) and [Fastity](https://www.fastify.io/) offering an API and a Websocket server.

### API Reference

| path              | description                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `/api/createRoom` | Create a room inside the server, will respond with the roomId : `{roomId: string}` |

### Socket signals

| signal          | designed side (from) | description                                                                                                                              |
| --------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `joinRoom`      | Client               | Expect a roomId and a name, connect the client socket to the room server side will respond as soon as the job is down with `successJoin` |
| `startGame`     | Client               | Todo                                                                                                                                     |
| `taskCode`      | Client               | Todo                                                                                                                                     |
| `disconnect`    | Client               | Todo                                                                                                                                     |
| `meetingButton` | Client               | Todo                                                                                                                                     |

### Front end
Front end part is build on [Angular V11](https://angular.io/), using socket.io-client (despite ngx-socket-io angular module does not seem to work).

### Deployment 
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