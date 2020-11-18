
const surface = document.getElementById( "testSurface" );
const app = document.getElementById( "AppContainer" );

import {JSOX} from "./jsox.js" 
import {popups,Popup} from "./popups.js"

import {classes} from "./flatland.classes.mjs"

classes.setDecoders( JSOX );

const l = {
	world : null,
	scale : 0.01, 
	ws : null, // active connection to server.
	worldCtx : null, // world editor default context
	w : 512,
	h : 768/2,
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

//----------- World Selector ------------------------------

function selectWorld( worldList ){
	const selector = new popups.create( "Select World", app );
	for( let world of worldList ) {
		const row = document.createElement( "div" );
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		name.textContent = world.name;
		name.style.display = "table-cell";
		row.appendChild( name );
		const open = popups.makeButton( row, "Open", ((world)=>()=>{
			l.ws.send( JSOX.stringify( {op:'world', world:world } ) );
			selector.hide();
		})(world) );
		open.style.display = "table-cell";
		open.style.float = "right";
		selector.appendChild( row );
	}

	{
		const row = document.createElement( "div" );
		const name = document.createElement( "span" );
		name.textContent = "New World";
		name.style.display = "table-cell";
		row.style.display = "table-row";
		row.appendChild( name );
		const open = popups.makeButton( row, "New", ()=>{
			selector.hide();
			const question = popups.simpleForm( "Enter new world name", "Name:", "My World", (val)=>{
				l.ws.send( JSOX.stringify( {op:'create', sub:"world", name:val } ) );
				question.remove();
				//selector.remove();
			}, ()=>{
			} );
			question.show();
		} );
		open.style.display = "table-cell";
		open.style.float = "right";
		selector.appendChild( row );
	}

	selector.show();
	return selector;
}

//------------------------------------------------------------------

function canvasRedraw() {


	const ctx = l.worldCtx
//	ctx.
	for( let sector of l.world.sectors ){
		const o = sector.origin;
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,127,0)"
		ctx.moveTo( l.w + o.x / l.scale - 3, l.h + o.y / l.scale + 2 );
		ctx.lineTo( l.w + o.x / l.scale + 3, l.h + o.y / l.scale + 2 );
		ctx.lineTo( l.w + o.x / l.scale    , l.h + o.y / l.scale - 2 );
		ctx.lineTo( l.w + o.x / l.scale - 3, l.h + o.y / l.scale + 2 );
		ctx.stroke();	

		let start = sector.wall;
		let check = start;
		const priorend = [true];
		let pt = start.from;
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( l.w + pt.x / l.scale, l.h + pt.y / l.scale );
		do {
			let pt = check.to;
			ctx.lineTo( l.w + pt.x / l.scale, l.h + pt.y / l.scale );


			function triangle(x,y)
			{
				const v = new Vector();
				v.addScaled
				ctx.beginPath();
				ctx.strokeStyle = "rgb(0,127,0)"
				ctx.moveTo( l.w + x / l.scale - 3, l.h + y / l.scale + 2 );
				ctx.lineTo( l.w + x / l.scale + 3, l.h + y / l.scale + 2 );
				ctx.lineTo( l.w + x / l.scale    , l.h + y / l.scale - 2 );
				ctx.lineTo( l.w + x / l.scale - 3, l.h + y / l.scale + 2 );
				ctx.stroke();	
			}	

			check = check.next(priorend);
		}while( check != start )
		// and go back to initial start point
		ctx.lineTo( l.w + pt.x / l.scale, l.h + pt.y / l.scale );	
		ctx.stroke();	

		pt = start.from;
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( l.w + pt.x / l.scale, l.h + pt.y / l.scale );
		do {
			triangle( check.line.r.o.x, check.line.r.o.y );
			const end = check.to;
			square( end.x, end.y );
			const start = check.from;
			square( start.x, start.y );
			function triangle(x,y)
			{
				ctx.beginPath();
				ctx.strokeStyle = "rgb(0,127,0)"
				ctx.moveTo( l.w + x / l.scale - 3, l.h + y / l.scale + 2 );
				ctx.lineTo( l.w + x / l.scale + 3, l.h + y / l.scale + 2 );
				ctx.lineTo( l.w + x / l.scale    , l.h + y / l.scale - 2 );
				ctx.lineTo( l.w + x / l.scale - 3, l.h + y / l.scale + 2 );
				ctx.stroke();	
			}	


			function square(x,y)
			{
				ctx.beginPath();
				ctx.strokeStyle = "rgb(0,0,127)"
				ctx.moveTo( l.w + x / l.scale - 3, l.h + y / l.scale - 3 );
				ctx.lineTo( l.w + x / l.scale + 3, l.h + y / l.scale - 3 );
				ctx.lineTo( l.w + x / l.scale + 3, l.h + y / l.scale + 3 );
				ctx.lineTo( l.w + x / l.scale - 3, l.h + y / l.scale + 3 );
				ctx.lineTo( l.w + x / l.scale - 3, l.h + y / l.scale - 3 );
				ctx.stroke();	
			}	


			check = check.next(priorend);
		}while( check != start )
		// and go back to initial start point


	}
}


function setupWorld( world ) {
	const selector = new popups.create( "World Editor", app );
	const canvas = document.createElement( "canvas" );
	l.world = world;

	canvas.width = 1024;
	canvas.height = 768;
	l.worldCtx= canvas.getContext( "2d" );
	selector.appendChild( canvas );

	canvasRedraw();
	console.log( "Okay world data:", world.name );
}

let selector = null;
function processMessage( msg ) {
	if( msg.op === "worlds" ) {
		if( selector ) selector.remove();
		selector = selectWorld( msg.worlds );

	} else if( msg.op === "error" ) {
		popups.simpleNotice( "Error", msg.error, ()=>{
			selector.show();	
		});
	} else if( msg.op === "world" ) {
		console.log( "SETUP" );
		setupWorld( msg.world );
	} else if( msg.op === "create" ) {
		if( msg.sub === "sector" ) {
		}	
	} else if( msg.op === "error" ) {
	  	console.log( "ERROR:", msg );
	} else {
		console.log( "Unhandled:", msg );
	}
}

openSocket();


