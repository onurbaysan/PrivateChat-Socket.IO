var socket;
var nck;

function clientSocket(nickname) {
	
	socket = io.connect(document.location.href);
		
	socket.on("connect", function() {
		socket.emit("newUser", nickname);
    });
	
	
	// Send message
	socket.on("sendMessage" , function(nickname, data) {		
		var cls = $('#firstone').attr('class');
		
		
		if(nickname == 'System') {
			$('#general').append("<p class='text-success'>" + nickname + " : " + data + "</p>");	
			$('#General-span').text(parseInt($('#General-span').text())+1);			
		} else {
			$('#general').append("<p class='muted'>" + nickname + " : " + data + "</p>");	
			$('#General-span').text(parseInt($('#General-span').text())+1);
		}		
		
		if(cls == 'active') {
			$('#General-span').text(0);
			$('#General-span').hide();
		} else
			$('#General-span').show();
		
	});
	
	// Retrieve user list
    socket.on("refreshUsers", function(data){ 
		$('#userlist').find('li:not(:first)').remove();		
		$('#tabcontent').find('div:not(:first)').remove();
		/* $('#userlist').append("<li class='active'><a href='#general' data-toggle='tab' id='General'>General</a></li>");
		$('#tabcontent').append("<div id='general' class='tab-pane active'><h4>Messages</h4></div>"); */
		
        $.each(data, function(key, value){		
			if(key != nck) {
				$('#userlist').append("<li id='" + key +"-li'><a href='#" + key + "' data-toggle='tab' id='" + key +"-anc'>" + key + "<span style='display: none' class='badge badge-important' id='"+ key + "-span'>0</span></a></li>");
				$('#tabcontent').append("<div id='" + key + "' class='tab-pane'><h4>Private Messages Between "+ nck + " and " + key +"</h4><span class='label label-info' id='" + key + "-status'></span></div>");				
			}
        }); 
    });		
	
	
	// Private Messaging
    socket.on("privateMessage", function(nickname, data){
		var cls = $('#' + nickname + '-li').attr('class');
		
        $('#' + nickname).append("<p><font color='red'>" + nickname + "</font> : " + data + "</p>");		
			
		
		//Increase notification count 
		$('#' + nickname + '-span').text(parseInt($('#' + nickname + '-span').text())+1);	
		
		if(cls == 'active') {
			$('#' + nickname + '-span').text(0);
			$('#' + nickname + '-span').hide();
			socket.emit('updateStatus', { msg: "[[[SEEN]]]"  , to: nickname , from: nck });	
		} else
			$('#' + nickname + '-span').show(); 
    });
	
	socket.on("updateStatus" , function(nickname, data) 
	{
		$('#' + nickname + '-status').text(data);
	});
	
	socket.on("disconnect", function(){});
}

function test() {
	nck = $('#nickname').val();
	$('#loginScreen').fadeOut("slow", function(){
        $('#chatScreen').fadeIn("slow");
    });	
	document.title = nck;		
	clientSocket(nck);
}

function message() {
	
	var txt = $('#textMessage').val();
	var to = $('#userlist li.active').find('a').attr('id');	
	to = to.substring(0,to.indexOf('-anc'));	
	
	$('#textMessage').val('');
	
	if(to == 'General') 
	{
		$('#general').append("<p class='text-warning'>" + nck + " : " + txt + "</p>");	
		socket.emit('sendMessage', nck, txt);
	} else {		
		$('#' + to).append("<p class='text-warning'>" + nck + " : " + txt + "</p>");		
		socket.emit('privateMessage', { msg: txt, to: to , from: nck });	
	}	
}

function updateStat(message) {
	var to = $('#userlist li.active').find('a').attr('id');	
	to = to.substring(0,to.indexOf('-anc'));
	
	if(to != 'General')
	{
		socket.emit('updateStatus', { msg: message , to: to , from: nck });	
	}
}