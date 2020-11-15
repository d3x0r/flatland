
const surface = document.getElementById( "testSurface" );
const app = document.getElementById( "AppContainer" );

import {JSOX} from "./jsox.js" 
import {popups,Popup} from "./popups.js"

const l = {
	ws : null, // active connection to server.
};


function openSocket() {

	var ws = new WebSocket("ws://"+location.host+"/", "Flatland");
	
	ws.onopen = function() {
		// Web Socket is connected. You can send data by send() method.
		//ws.send("message to send"); 
		l.ws = ws;
		ws.send( '{op:worlds}' );
	};
	ws.onmessage = function (evt) { 
		const msg_ = JSOX.parse( evt.data );
		processMessage( msg_ );
	};
	ws.onclose = function() { 
		l.ws = null;
		
		setTimeout( openSocket, 5000 ); // 5 second delay.
		// websocket is closed. 
	};
}

function selectWorld( worldList ){
	const selector = new popups.create( "Select World", app );
	for( let world of worldList ) {
		const row = document.createElement( "div" );
		const name = document.createElement( "span" );
		name.textContent = world.name;
		row.appendChild( name );
		const open = popups.makeButton( row, "Open", ((world)=>()=>{
			l.ws.send( JSOX.stringify( {op:'world', world:world } ) );
			this.hide();
		})(world) );
		selector.appendChild( row );
	}

	{
		const row = document.createElement( "div" );
		const name = document.createElement( "span" );
		name.textContent = "New World";
		row.appendChild( name );
		const open = popups.makeButton( row, "New", ()=>{
			const question = popups.simpleForm( "Enter new world name", "Name:", "My World", (val)=>{
				l.ws.send( JSOX.stringify( {op:'create', sub:"world", name:val } ) );
				question.remove();
				selector.remove();
			}, ()=>{
			} );
			question.show();
		} );
		selector.appendChild( row );
	}

	selector.show();
}

function processMessage( msg ) {
	if( msg.op === "worlds" ) {
		selectWorld( msg.worlds );
	} else if( msg.op === "world" ) {
		setupWorld( msg.world );
	} else if( msg.op === "create" ) {
		if( msg.sub === "sector" ) {
		}	
	}

}

openSocket();


