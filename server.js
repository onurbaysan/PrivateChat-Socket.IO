var http = require('http'),
    fs = require('fs'),
	path = require('path');
    //index = fs.readFileSync(__dirname + '/index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
	var filePath = '.' + req.url;
	if (filePath == './')
		filePath = './index.html';
		
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	switch (extname) {
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
	}
	
	path.exists(filePath, function(exists) {
	
		if (exists) {
			fs.readFile(filePath, function(error, content) {
				if (error) {
					res.writeHead(500);
					res.end();
				}
				else {
					res.writeHead(200, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
				}
			});
		}
		else {
			res.writeHead(404);
			res.end();
		}
	});
    //res.writeHead(200, {'Content-Type': 'text/html'});
    //res.end(index);
});


// Socket.io server listens to our app
var io = require('socket.io').listen(app);


io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
//io.enable('browser client gzip');          // gzip the file

app.listen(3000);

// Connected user list
var users = {};
// Socket infos of connected users 
var sockets = {};

// Emit welcome message on connection
io.sockets.on('connection', function(socket) {	
	socket.on("newUser" , function(username) {
		socket.username = username;		
		socket.userId = users.length;
		
		users[username] = {
			username : username,
			userId : users.length
		};
			
		sockets[username] = socket;

		// Send only the connected user
		socket.emit("sendMessage" , "System" , "Welcome...");
			
		// Send message all users except the last connected user
		socket.broadcast.emit("sendMessage", "System" , username + " is connected");
					
		io.sockets.emit("refreshUsers" , users);
		
	});

	socket.on('disconnect', function(){		        
        // Broadcast disconnected users name
        socket.broadcast.emit("sendMessage", "System", socket.username + " is disconnected :(");
		
		delete sockets[socket.username];		
		delete users[socket.username]; 
		
        // Send connected user list to the connected user
        io.sockets.emit("refreshUsers", users);
    });	
	
	
    socket.on("sendMessage", function(nickname, data){        
		socket.broadcast.emit("sendMessage", nickname, data);
    });
	
	socket.on("privateMessage" , function(data) {
		sockets[data.to].emit("privateMessage", data.from, data.msg);		
	});
	
	socket.on("updateStatus" , function(data) 
	{
		if(data.msg === '[[[SEEN]]]')
		{
			sockets[data.to].emit("updateStatus", data.from, "Seen at: " + new Date().toUTCString());	
		} else {
			sockets[data.to].emit("updateStatus", data.from, data.msg);	
		}
	});
});