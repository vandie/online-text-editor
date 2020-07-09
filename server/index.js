const WebSocket = require('ws');
 
// Create a websocket server
const wss = new WebSocket.Server({ port: 3000 });

let users = [];
let text = ""


function userName(ws) {
  const user = users.find(user => user.ws === ws);
  return user === undefined ? "Un-named" : user.name;
}
 
// When a user connects tell them about everyone else
wss.on('connection', function connection(ws) {
  console.log("A User Connected, telling about other users");
  ws.send(JSON.stringify({
    action:"clientList",
    clients: users.map(user => user.name)
  }));
  ws.send(JSON.stringify({
    action:"updateText",
    text
  }));

  // Register a message handler for this user
  ws.on('message', function incoming(data) {
    console.log("A Message was recieved");
    // If this is a new user we need to tell everyone about them
    try {
      const jsonData = JSON.parse(data);
      if(jsonData.action === "RegisterName"){
        users.push({
          ws,
          name: jsonData.name
        });
        console.log(`${jsonData.name} Connected`);
        wss.clients.forEach(function each(client) {
          console.log(`telling ${userName(client)} about ${jsonData.name}`);
          client.send(JSON.stringify({
            action:"clientList",
            clients: users.map(user => user.name)
          }));
        });
        return;
      }

      if(jsonData.action === "updateText"){
        text = jsonData.text;
        console.log(`text is now:\n${text}`);
      }
    } catch(e) {
      console.log("message was not JSON")
    }
    // Send the message to every other client excluding itself
    wss.clients.forEach(function each(client) {
      console.log(`Sending data to ${userName(client)}`);
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("close", function disconect() {
    users = users.filter(user => user.ws !== ws);
    ws.send(JSON.stringify({
      action:"clientList",
      clients: users.map(user => user.name)
    }));
  });
});