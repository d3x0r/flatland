
import {sack} from "sack.vfs" ;

const JSOX = sack.JSOX;
const storage = sack.ObjectStorage( "store.os" );
import path from "path";
import {World} from "./flatland.classes.mjs";

storage.getRoot().then( r=>{
	console.log( "Root:", r );
	root = r;
	for( var file of root.files ) {
		l.worlds.push( new GameWorld( file.name ) );
	}
} );
let root = null;

console.log( "Root?", root );

const l = {
	worlds : [],	
}

class GameWorld {
	#playerList = [];
	world = new World();
	name = null;
	constructor( name ) {
		
		this.name = name;
	}
	get players() {
		return this.#playerList.length;
	}	
	get world() {
		this.#world = root.open( this.name ).then(file=>{
			return file.read().then( data=>{
				const w = JSOX.parse( data );
				return w;
			} )
		} );
		return this.#world;
	}	
	addPlayer(ws) {
		this.#playerList.push(ws);
	}
	delPlayer(ws) {
		var idx = this.#playerList.find( p=>w===ws );
		if( idx >= 0 )
			this.#playerList.slice(idx,1);
		else console.log( "Failed to find player to remove." );
	}
}

//JSOX.toJSOX( "", GameWorld )


function openServer( opts, cb )
{
	var serverOpts = opts || {port:Number(process.argv[2])||5000} ;
	var server = sack.WebSocket.Server( serverOpts )
	var disk = sack.Volume();
	console.log( "serving on " + serverOpts.port );
	console.log( "with:", disk.dir() );


server.onrequest( function( req, res ) {
	var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
		 req.connection.remoteAddress ||
		 req.socket.remoteAddress ||
		 req.connection.socket.remoteAddress;
	//ws.clientAddress = ip;

	//console.log( "Received request:", req );
	if( req.url === "/" ) req.url = "/index.html";
	var filePath = "flatland_client" + unescape(req.url);
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
		res.writeHead(200, { 'Content-Type': contentType });
		console.log( "Read:", "." + req.url );
		res.end( disk.read( filePath ) );
	} else {
		console.log( "Failed request: ", req );
		res.writeHead( 404 );
		res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
	}
} );

server.onaccept( function ( ws ) {
	if( cb ) return cb(ws)
//	console.log( "Connection received with : ", ws.protocols, " path:", resource );
        if( process.argv[2] == "1" )
		this.reject();
        else
		this.accept();
} );

server.onconnect( function (ws) {
	ws.world = null; // extend socket.
	//console.log( "Connect:", ws );
	ws.onmessage( function( msg_ ) {
		const msg = JSOX.parse( msg_ );
		
        	//console.log( "Received data:", msg );
                //ws.send( msg );
		if( msg.op === "worlds" ) {
			ws.send( JSOX.stringify( {op:"worlds", worlds:l.worlds } ) );
		} else if( msg.op === "create" ) {
			if( msg.sub === "world" ) {
				const newWorld = new World(msg.name);
				l.worlds.push( new GameWorld( msg.name ) );
				root.has( msg.name ).then( ()=>{
					ws.send( JSOX.stringify( {op:"error", error:"World already exists" } ) );
					return;
				} ).catch( ()=>{
					root.create( msg.name ).then( (world)=>{
						world.write( JSOX.stringify( newWorld ) );
					} );
				} );
				newWorld.addPlayer( ws );
				ws.send( JSOX.stringify( {op:"world", world:newWorld } ) );
			}
		}
		//ws.close();
		console.log( "need to handle message:", msg );
        } );
	ws.onclose( function() {
      //console.log( "Remote closed" );
		if( ws.world )
			ws.world.delPlayer(ws);
	} );
} );

}


openServer();
