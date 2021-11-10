
import {sack} from "sack.vfs" ;

const JSOX = sack.JSOX;
const storage = sack.ObjectStorage( "fs/store.os" );
import path from "path";
const StoredObject = storage.StoredObject;
import {classes,World} from "./flatland_client/flatland.classes.mjs";
import {handleRequest as socketHandleRequest} from "@d3x0r/socket-service";

//const loginCode = sack.HTTPS.get( { port:8089, hostname:"d3x0r.org", path:"serviceLogin.mjs" } );
//  eval( loginCode ); ... (sort-of)
import {UserDbRemote} from "@d3x0r/user-database-remote";
UserDbRemote.import = Import;      
UserDbRemote.on( "expect", expect );
  
function Import(a) { return import(a)} 
let  loginServer;
openLoginServer(); // must only be called once...

function openLoginServer() {
	loginServer = null;
	setTimeout( ()=>initServer( loginServer = UserDbRemote.open() ), 5000 );

	function initServer( loginServer ) {
		if( loginServer )
			loginServer.on( "close", openLoginServer );
		else
			console.log( "Socket connection failed..." );
	}
}


const connections = new Map();

class User extends StoredObject {
	name=null;
	
	constructor() {
	}
	set( uid, name ) {
		this.store();
	}
}

function expect( msg ) {
	console.log( "Told to expect a user: does this result with my own unique ID?", msg );

	const id = sack.Id();
	const user = msg;
	connections.set( id, user );
	// lookup my own user ? Prepare with right object?
	// connections.set( msg.something, msg ) ;	
	console.log( "expected user:", id );
	return id;
}



classes.setEncoders( JSOX );
classes.setDecoders( JSOX );

storage.getRoot().then( r=>{
	root = r;
	console.log( "got root..." );
	for( var file of root.files ) {
		l.worlds.push( new GameWorld( file.name ) );
	}
} );
let root = null;

const l = {
	worlds : [],
	loading : [], // loading (on load menu)
}

class GameWorld {
	#playerList = [];
	#world = null;
	name = null;


	constructor( name ) {
		
		this.name = name;
	}
	
	get players() {
		return this.#playerList.length;
	}	
	set world(w) { this.#world = Promise.resolve(w) };
	get world() {
		if( !this.#world ) {
			this.#world = root.open( this.name ).then(file=>{
				return file.read().then( data=>{
					const w = ( data && JSOX.parse( data ) ) || new World();
					if( !w.sectors.length ){
						w.createSquareSector( 0, 0 );
						file.write( w );
					}
					setupWorldEvents( this, w );
					console.log( "Parsed:", w, data );
					return w;
				} )
			} ).catch( ()=>{
				const w = new World();
				w.createSquareSector( 0, 0 );
				setupWorldEvents( this, w );
				return root.open( this.name ).then( file=>{
					console.log( "writing initial file:", file, w );
				
					return file.write( JSOX.stringify( w ) ).then( ()=>w );
				} );
			} );
		}
		console.log( "world should be some sort of promise", this.#world)
		return this.#world;
	}	
	addPlayer(ws) {
		this.#playerList.push(ws);
	}
	delPlayer(ws) {
		var idx = this.#playerList.find( p=>p===ws );
		if( idx >= 0 )
			this.#playerList.splice(idx,1);
		else console.log( "Failed to find player to remove." );
	}
	send(from,msg) {
		for( let p = 0; p < this.#playerList.length; p++ )
		{
			const to = this.#playerList[p];
			if( to.readyState === 1)
				to.send(msg );
			else if( to.readyState == 3 ){
				this.#playerList.splice(p, 1 );
				p--; // recheck this spot.
			}
		}
	}
}

//JSOX.toJSOX( "", GameWorld )


function openServer( opts, cb )
{
	var serverOpts = opts || {port: Number(process.argv[2]) || process.env.PORT || 5000} ;
	var server = sack.WebSocket.Server( serverOpts )
	var disk = sack.Volume();
	console.log( "serving on " + serverOpts.port, server );
	console.log( "with:", disk.dir() );


server.onrequest = function( req, res ) {
	var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
		 req.connection.remoteAddress ||
		 req.socket.remoteAddress ||
		 req.connection.socket.remoteAddress;
	//ws.clientAddress = ip;
	if( socketHandleRequest( req, res ) ) {
		console.log( "Handled by socket-service" );
		return;
	}
	//console.log( "Received request:", req );
	if( req.url === "/" ) req.url = "/index.html";
	var filePath = "flatland_client" + unescape(req.url);
	if( req.url.startsWith( "/node_modules/" ) )
		filePath="." + unescape(req.url);

	
	//if( req.url === '/socket-service-swbundle.js' ) filePath = 'node_modules/@d3x0r/socket-service/swbundle.js'
	//if( req.url === '/socket-service-swc.js' ) filePath = 'node_modules/@d3x0r/socket-service/swc.js'

	var extname = path.extname(filePath);
	var contentType = 'text/html';
	console.log( ":", extname, filePath )
	switch (extname) {
		  case '.js':
		  case '.mjs':
			  contentType = 'text/javascript';
			  break;
		  case '.css':
			  contentType = 'text/css';
			  break;
		  case '.json':
			  contentType = 'application/json';
			  break;
		  case '.png':
			  contentType = 'image/png';
			  break;
		  case '.jpg':
			  contentType = 'image/jpg';
			  break;
		  case '.wav':
			  contentType = 'audio/wav';
			  break;
                case '.crt':
                        contentType = 'application/x-x509-ca-cert';
                        break;
                case '.pem':
                        contentType = 'application/x-pem-file';
                        break;
                  case '.wasm': case '.asm':
                  	contentType = 'application/wasm';
                        break;
	}
	if( disk.exists( filePath ) ) {
		res.writeHead(200, { 'Content-Type': contentType
			/*'Access-Control-Allow-Origin':"https://d3x0r.org", Vary: "Origin"*/ });
		console.log( "Read:", "." + req.url );
		res.end( disk.read( filePath ) );
	} else {
		console.log( "Failed request: ", req );
		res.writeHead( 404 );
		
		res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
	}
};

server.onaccept = function ( ws ) {
	//console.log( "this?", this,ws );
	if( cb ) return cb(ws)
//	console.log( "Connection received with : ", ws.protocols, " path:", resource );
        if( process.argv[2] == "1" )
		this.reject();
        else
		this.accept();
};

server.onconnect = function (ws) {
   ws.World = null;
	ws.world = null; // extend socket.
	ws.lastMessage = Date.now();
	//console.log( "Connect:", ws );
	ws.onmessage = function( msg_ ) {
		ws.lastMessage = Date.now();
try {
		
		const msg = ("string"===typeof msg_)?JSOX.parse( msg_ ):msg_;
      	console.log( "Received data:", msg );
        //ws.send( msg );
		if( storage.handleMessage( ws, msg ) ) {
		    // else it's should be processed here.
			console.log( "Handled by storage?" );
		} else if( msg.op === "worlds" ) {
			console.log( "Lookup user:", msg.user );
			const user = connections.get( msg.user );
			if( user ) {
				connections.delete( msg.user );

				ws.send( JSOX.stringify( {op:"worlds", worlds:l.worlds, uworlds: user.worlds } ) );
				l.loading.push(ws);
			} else {
				ws.send( JSOX.stringify( {op:"no" } )  );
				ws.close(1000, "no");
			}
		} else if( msg.op === "deleteWorld" ) {
			const oldIdx = l.worlds.findIndex( w=>w.name === msg.world.name );
			console.log( "if user key matches creator...", msg.user, oldIdx, msg );
			if( oldIdx >= 0 ) {
				for( let loading of l.loading ) {
					console.log( "Sending delete world:",l.worlds[oldIdx])
					loading.send( JSOX.stringify( {op:"deleteWorld", world:l.worlds[oldIdx] } ) );
				}
				l.worlds.splice( oldIdx, 1 );
			}
		} else if( msg.op === "world" ) {
				const newWorld = l.worlds.find( w=>w.name === msg.world.name );
				const loadingIdx = l.loading.findIndex( w=>w===ws );
				if( loadingIdx >= 0 )
					l.loading.splice( loadingIdx, 1 );
				if( newWorld ) {
					ws.world = newWorld;
					//console.log( "SO WORLD?", newWorld );
					newWorld.addPlayer( ws );

					newWorld.world.then( (world)=>{
						ws.World = world;
						ws.world.world = world;
						if( !world ) throw new Error( "WORLD FAILED TO LOAD");
						console.log( "Loaded this world, and can now send it.", world );
						console.log( "SEND WORLD:\n", JSOX.stringify( world ) );
						ws.send( JSOX.stringify( {op:"world", world:world } ) );
					} );	
				}
		} else if( msg.op === "move" ) {
			//console.log( "Server should use this to update also...");
			if( msg.t === 'S' ) {
				ws.World.moveSector( msg.id, msg.x, msg.y, msg.lock );
				//const m = JSOX.stringify(msg );
				//ws.world.send( ws, m );
			}
			if( msg.t === 'o' ) {
				ws.World.walls[msg.id].move( msg.x, msg.y, msg.lock );
				ws.World.on("update" );
				//const m = JSOX.stringify(msg );
				//ws.world.send( ws, m );
			}
			if( msg.t === 's' ) {
				ws.World.walls[msg.id].turn( msg.x, msg.y, msg.lock );
				ws.World.on("update" );
				//const m = JSOX.stringify(msg );
				//ws.world.send( ws, m );
			}
			if( msg.t === 'e0' ) {
				ws.World.walls[msg.id].setStart( msg.x, msg.y, msg.lock );
				ws.World.on("update" );
			}
			if( msg.t === 'e1' ) {
				ws.World.walls[msg.id].setEnd( msg.x, msg.y, msg.lock );
				ws.World.on("update" );
				//world.walls[msg.wall].move( msg.x, msg.y );
				//const m = JSOX.stringify(msg );
				//ws.world.send( ws, m );
			}
		} else if( msg.op === "create" ) {
			if( msg.sub === "world" ) {
				console.log("Lookup", root, msg.name );
				if( !root ) 
				{
					ws.send( JSOX.stringify( {op:"error", error:"Directory not ready yet..." } ) );
					return;
				}

				root.has( msg.name ).then( (exists)=>{
					console.log( "exists:",exists)
					if( exists ) {
						ws.send( JSOX.stringify( {op:"error", error:"World already exists" } ) );
					}else {
						root.create( msg.name ).then( (file)=>{
							if( !file ) {
								ws.send( JSOX.stringify( {op:"error", error:"World already exists" } ) );
								throw new Error( "File already exists; did not create:" + msg.name );
							}else {
								const newWorld = new GameWorld(msg.name);
								l.worlds.push( newWorld );
								const loadingIdx = l.loading.findIndex( w=>w===ws );
								if( loadingIdx >= 0 )
									l.loading.splice( loadingIdx, 1 );
								console.log( "CREATING WORLD TELL OTHERS?", l.loading );
								for( let loading of l.loading ) {
									loading.send( JSOX.stringify( {op:"newWorld", world:newWorld } ) );
								}
								console.log( "File:", newWorld );
								newWorld.addPlayer( ws );
								newWorld.world .then( (world)=>{
				                                   	ws.World = world;
									ws.send( JSOX.stringify( {op:"world", world:world } ) );
								})
							}
						} );
					}
					return;
				} ).catch( (asfd)=>{
					console.log( "This should have the file, but doesn't?", asfd );
				} );
			}
		}
		else {
			//ws.close();
			console.log( "need to handle message:", msg );
		}
}catch(err){
	console.log( "Error Parsing:", err, msg_ );
}
        } ;

	ws.onclose = function() {
	  //console.log( "Remote closed" );
		const loadingIdx = l.loading.findIndex( w=>w===ws );
		if( loadingIdx >= 0 )
			l.loading.splice( loadingIdx, 1 );
		if( pingTimer ) clearTimeout( pingTimer );
		  
		console.log( "DELETE PLAYER:", ws.world );
		if( ws.world && !(ws.world instanceof Promise) )
			ws.world.delPlayer(ws);
	};
	let pingTimer =null;
	pingTick();
	function pingTick(){
		let now = Date.now();
		if( (now - ws.lastMessage) >= 30000 )     {
			//console.log( "Ping", (now - ws.lastMessage) );
			ws.ping();
			ws.lastMessage = now;
		}
		
		pingTimer = setTimeout( pingTick, 30000 - (now - ws.lastMessage) );
	}
} ;

}


function setupWorldEvents(newWorld, world) {
	const sendBuffer = [];
	const lines = [];
	world.on( "update", ()=>{
		for( let line of lines )
			sendBuffer.push({op:'Line',id:line.id,data:line.toJSOX() });

		const buf = sendBuffer.map( (b)=>JSOX.stringify(b) ).join('');
		//console.log( "--- WORLD UPDATE flush pending changes to all ----", buf );
		sendBuffer.length = 0;
		newWorld.send( null, buf );
	} );
	console.trace( "World walls doesn't have events now??", world )
	world.wallSet.on( "update", (wall)=>{
		sendBuffer.push({op:"Wall", id:wall.id,data:wall.toJSOX() });
	} );
	world.sectorSet.on( "update", (sector)=>{
		sendBuffer.push({op:"Sector", id:sector.id,data:sector.toJSOX()});
	} );
	world.lineSet.on( "update", (line)=>{
		if( !lines.find( l=>l===line )){
			lines.push( line );
		}
	} );

	world.wallSet.on( "create", (wall)=>{
		sendBuffer.push({ op:'wall', id:line.id,wall:wall});
	} );
	world.sectorSet.on( "create", (sector)=>{
		sendBuffer.push({ op:'sector', id:line.id,sector:sector});
	} );
	world.lineSet.on( "create", (line)=>{
		sendBuffer.push({ op:'line',id:line.id, line:line});
	} );

	world.wallSet.on( "destroy", (wall)=>{
		sendBuffer.push({ op:'destroyWall',id:wall.id });
	} );
	world.sectorSet.on( "destroy", (sector)=>{
		sendBuffer.push({ op:'destroySector',id:sector.id });
	} );
	world.lineSet.on( "destroy", (line)=>{
		sendBuffer.push({ op:'destroyLine',id:line.id });
	} );
}

openServer();
