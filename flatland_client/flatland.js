
const surface = document.getElementById( "testSurface" );
const app = document.getElementById( "AppContainer" );

//import {JSOX} from "jsox" 
//import {popups,Popup} from "@d3x0r/popups"
import {JSOX} from "/node_modules/jsox/lib/jsox.mjs"
import {popups,Popup} from "/node_modules/@d3x0r/popups/popups.mjs"
import {ObjectStorage} from "/node_modules/@d3x0r/object-storage/object-storage-remote.mjs"
//import {workerInterface}  from "/node_modules/@d3x0r/socket-service/swc.js";

import {classes,Vector} from "./flatland.classes.mjs"
const parser =  JSOX.begin(processMessage);
classes.setDecoders( JSOX );

var requiredImages = [];
var maxRequired = 0; // countdown to dispatch next init after all requested images load

const localStorage = window.localStorage || { getItem(a){ return undefined;} };

const l = {
	world : null,
	canvas : null,
	scale : 0.05, 
	ws : null, // active connection to server.
	worldCtx : null, // world editor default context
	refresh : false,
	xOfs : 0,
	yOfs : 0,
	w : 0,
	h : 0,
	cursor : newImage( "cursor.png" ).then( img=>{
		l.cursor = img;
		l.cursorNot = processImage( img );
		return img;
	}),
	cursorNot : null,
	cursorSpot : {x:5, y:5},
	storage : null,
	root : null,
	login : null,
};

//import {connection,Alert,openSocket} from "/login/webSocketClient.js";
import loginServer from "/internal/loginServer";
const loginInterface = ( ("https://"+loginServer.loginRemote+":"+loginServer.loginRemotePort) || "https://d3x0r.org:8089" ) + "/login/webSocketClient.js";

let n = 0;
let loginDone = false;

async function firstConnect() {
	return await import( loginInterface+"?"+n++ ).then( (module)=>{
		//console.log("Thing:", module );
		beginLogin( module.openSocket, module.connection );
		return module;
	} ).catch( (err)=>{
		//console.log( "err:", err );
		return new Promise( (res,rej)=>{
			setTimeout( ()=>firstConnect().then( res ), 5000 );
		} );
	} );
}
// gets login interface from login server
// blocks until a connection happens - should be a temporary thing that it blocks...
const wsc = await firstConnect();

//import {connection,Alert,openSocket} from "/login/webSocketClient.js";


function beginLogin( openSocket, connection ) {

	let login = openSocket().then( (socket)=>{
		console.log( "Open socket finally happened?", socket );
			//login = socket;
		socket.setUiLoader();
		connection.on( "close", (code, reason)=>{
			if( !l.login ) {
				console.log( "Closed login before login; refresh page" );
				location.href=location.href;
			} else {
				console.log( "Let GC have this socket, auth is already done" );
			}
		} ) 
		connection.loginForm = popups.makeLoginForm( (token)=>{
			// this token == true
			//console.log( "login completed...", token );
				if( token )
					connection.request( "d3x0r.org", "flatland" ).then( (token)=>{
						;
						//console.log( "flatland request:", token );
						l.login = token; // this is 'connection' also.
						// token.name, token.svc, svc.addr.port, svc.addr.addr[], svc.key
						connection.loginForm.hide();
						socket.close( 1000, "Thank You.");
						openGameSocket( token.name, token.svc.key );
					} );
			}
			, {wsLoginClient:connection ,
				useForm: (location.protocol+"//"+loginServer.loginRemote+":"+loginServer.loginRemotePort) + "/login/loginForm.html",
				parent: app
			} );

		connection.loginForm.show();
		return socket;
	} );

}

function openGameSocket( uid, key ) {
	// this COULD use workerInterface to create the socket instead...
	var ws = new WebSocket((location.protocol==="http:"?"ws://":"wss://")+location.host+"/", "Flatland");
	const oldSend = ws.send.bind( ws);
	ws.send = function(Msg) {
		if( "object" === typeof Msg ) Msg= JSOX.stringify( Msg );
		oldSend( Msg );
	}

	
	ws.onopen = function() {
		// Web Socket is connected. You can send data by send() method.
		//ws.send("message to send"); 
		l.ws = ws;

		console.log( "What if login should have given a token..." );
		
		l.ws.send( `{op:worlds,user:${JSOX.stringify(uid)},key:${JSOX.stringify(key)}}` );
		//l.ws.send( '{op:worlds}' );
	};
	ws.onmessage = function (evt) { 				
		parser.write( evt.data );
		dispatchChanges();
	};
	ws.onclose = function() { 
		l.ws = null;
		setTimeout( ()=>openGameSocket( uid, key ), 5000 ); // 5 second delay.
		if( l.editor ) {
			l.editor.remove();
			l.editor = null;
			l.canvas = null;
		}
		// websocket is closed. 
	};
	l.storage = new ObjectStorage( ws );
}

//----------- World Selector ------------------------------

function selectWorld( worldList ){
	const selector = new popups.create( "Select World", app );
	const rows = [];

	selector.addWorld = addWorld;
	selector.delWorld = delWorld;

	function delWorld( world ) {
		for( let row of rows ) {
			if( row.world.name === world.name ) {
				console.log( "Delete world?" );
				row.row.remove();
				break;
			}
		}
	}
	function addWorld( world ) {
		const row = document.createElement( "div" );
		rows.push( {row:row, world:world});
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		name.textContent = world.name;
		name.style.display = "table-cell";
		row.appendChild( name );

		const delWorld = popups.makeButton( row, "X", ((world)=>()=>{
			row.remove();
				openGameSocket( );
			//selector.deleteItem( row );
			l.ws.send( JSOX.stringify( {op:'deleteWorld', world:world, user:localStorage.getItem( "userId" ) || "AllowMe" } ) );
			//selector.hide();
		})(world) );
		delWorld.style.display = "table-cell";
		delWorld.style.float = "right";


		const open = popups.makeButton( row, "Open", ((world)=>()=>{
			l.ws.send( JSOX.stringify( {op:'world', world:world } ) );
			selector.hide();
		})(world) );
		open.style.display = "table-cell";
		open.style.float = "right";

		selector.appendChild( row );

	}
	for( let world of worldList ) {
		addWorld( world );
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

const selectedHotSpot = "rgb(255,255,0)";
const wallOriginColor = "rgb(0,0,127)"

const unselectedSectorStroke = "rgb(128,45,25)";
const selectedSectorStroke = "rgb(0,127,0)";

const selectedWallStroke = "rgb(0,0,127)";
const unselectedWallStroke = "rgb(0,127,0)";

const selectedWallEndStroke = "rgb(0,127,0)";

const gridWhiteLine = "rgba(255,255,255,64)";

function DISPLAY_SCALE(x)  { return x /l.scale}
function DISPLAY_X(x)  { return DISPLAY_SCALE( x + l.xOfs )  }
function DISPLAY_Y(y)  { return DISPLAY_SCALE( y + l.yOfs ) }

function REAL_SCALE(x) { return x * l.scale;}
function REAL_X(x) { return REAL_SCALE(  x  )- l.xOfs}
function REAL_Y(y) { return REAL_SCALE(  y  )- l.yOfs}

const Near = (a,b,d )=>a&&b&&( Math.abs(a.x-b.x) < d && Math.abs(a.y-b.y) < d  && Math.abs(a.z - b.z ) < d )
const tmp = new Vector();

const editorState = {
	lockLineOrigin : false,
	lockCreate : false,
	lockSlope : false, 
	commandClick : false,
	lockDrag : false,
};

let mouse = {
	pos : new Vector()
	,rpos : new Vector()
	, set x(a) { return this.pos.x; }
	,set y(a) { return this.pos.y; }
	, drag:false
	, delxaccum : 0
	, delyaccum : 0

	, mouseLock : {
		to: null,  // text name of value
		drag: false, // is dragging
		near : null, // vector that is where this is
	}
	, CurSecOrigin : null
	, CurOrigin : null
	, CurSlope : null
	, CurEnds : [null,null]

	, CurSector : null // the current
	, priorCurrentSector : null // the last current known
	, CurSectors : [] // multiselect
	, CurWall:null
	, CurWalls : []
	//, 
	, flags : {
		bSectorOrigin : false,
		bOrigin : false,
		bSlope : false,
		bEndStart : false,
		bEndEnd : false,
		bLocked : false,
		bSelect : false,
		bMarkingMerge : false,
		bSectorList : false,
		bWwallList : false,
		bNormalMode : false,
	}

	, isNear(o,n) {
		if( mouse.mouseLock.near ){
			if( !mouse.mouseLock.drag && !Near( mouse.mouseLock.near, o, REAL_SCALE(mouse.mouseLock.del)  ) ) {
				mouse.mouseLock.to='';
				mouse.mouseLock.near = null;
			}
		}else {
			if( Near( o, mouse.CurSecOrigin, REAL_SCALE(10) ) ){
				mouse.mouseLock.near = mouse.CurSecOrigin;
				mouse.mouseLock.to += "CurSecOrigin";
				mouse.mouseLock.del = 30;
			}
			if( Near( o, mouse.CurEnds[0], REAL_SCALE(10) ) ){
				mouse.mouseLock.near = mouse.CurEnds[0];
				mouse.mouseLock.to += "CurEnds[0]";
				mouse.mouseLock.del = 30;
			}
			if( Near( o, mouse.CurEnds[1], REAL_SCALE(10) ) ){
				mouse.mouseLock.near = mouse.CurEnds[1];
				mouse.mouseLock.to += "CurEnds[1]";
				mouse.mouseLock.del = 30;
			}
			if( Near( o, mouse.CurSlope, REAL_SCALE(10) ) ){
				mouse.mouseLock.near = mouse.CurSlope;
				mouse.mouseLock.to += "CurSlope";
				mouse.mouseLock.del = 30;
			}
			if( Near( o, mouse.CurOrigin, REAL_SCALE(10) ) ){
				mouse.mouseLock.near = mouse.CurOrigin;
				mouse.mouseLock.to += "CurOrigin";
				mouse.mouseLock.del = 30;
			}
		}
	}
	, drawNear(o,n) {
		if( mouse.mouseLock && mouse.mouseLock.near ){
			tmp.sub( o, mouse.mouseLock.near );
			DrawLine( tmp, mouse.mouseLock.near,0,1.0, "rgb(255,255,255)" );
		}
	}

};


function DrawLine( d,o,from,to, c ){
	const ctx = l.worldCtx;
	ctx.beginPath();
	ctx.strokeStyle = c
	ctx.moveTo( DISPLAY_X( o.x + d.x * from), DISPLAY_Y( o.y + d.y * from) );
	ctx.lineTo( DISPLAY_X( o.x + d.x * to), DISPLAY_Y( o.y + d.y * to) );
	ctx.stroke();	
}
classes.setDrawLine(DrawLine);


function canvasRedraw() {


	const ctx = l.worldCtx

	ctx.clearRect( 0, 0, l.w, l.h );
	DrawDisplayGrid();
//	ctx.

	mouse.drawNear(mouse.rpos);

	mouse.CurSecOrigin = null;
	for( let sector of l.world.sectors ){
		const o = sector.origin;
		if( sector === mouse.CurSector ) {
			mouse.CurSecOrigin = o;

			ctx.font = "bold 30px serif";
			ctx.fillText( ""+mouse.mouseLock.to, DISPLAY_X( o.x ), DISPLAY_Y(o.y)-20 );
			//ctx.fillText( ""+(mouse.CurWall && mouse.CurWall.id) + (mouse.CurWall && mouse.CurWall.line.id), DISPLAY_X( o.x ), DISPLAY_Y(o.y)-0 );
			triangle( o.x, o.y, ( mouse.mouseLock.near === mouse.CurSecOrigin )?selectedHotSpot:  selectedSectorStroke );
		}
		else {
			ctx.font = "30px serif";
			ctx.fillText( ""+mouse.mouseLock.to,  DISPLAY_X( o.x ), DISPLAY_Y(o.y)-20 );
			triangle( o.x, o.y,( mouse.mouseLock.near === mouse.CurSecOrigin )?selectedHotSpot: unselectedSectorStroke );
		}



		let start = sector.wall;
		let check = start;
		let prior = null;
		const priorend = [true];
		let pt = start.from;

		// draw the walls.
		do {
			ctx.beginPath();
			let selected = false;
			if( sector === mouse.CurSector ){
				if( check === mouse.CurWall ) {
					ctx.strokeStyle = selectedWallStroke;
				} else {
					ctx.strokeStyle = unselectedWallStroke;
				}
			} else if( sector === mouse.priorCurrentSector ){
				if( check === mouse.CurWall ) {
					ctx.strokeStyle = selectedWallStroke;
				} else {
					ctx.strokeStyle = unselectedWallStroke;
				}
			} else
				if( check === mouse.CurWall ) {
					ctx.strokeStyle = selectedWallStroke;
				} else
					ctx.strokeStyle = "rgb(0,0,0)"
			pt = check.from;
			ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
			pt = check.to;
			ctx.lineTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
			ctx.stroke();
			check = check.next(priorend);
		}while( check != start )
		// and go back to initial start point
		/*
		ctx.beginPath();
		if( sector === mouse.CurSector ){
			if( prior === mouse.CurWall )
				ctx.strokeStyle = selectedWallStroke;
			else
				ctx.strokeStyle = unselectedWallStroke;
		} else
			if( check === mouse.CurWall )
				ctx.strokeStyle = selectedWallStroke;
			else
				ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
		pt = start.from;
		ctx.lineTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
		ctx.stroke();	
		*/


		// draw the icons on the walls
		pt = start.from;
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
		do {
			if( check === mouse.CurWall ) {

				mouse.CurOrigin = check.line.r.o;
				mouse.CurSlope = check.line.to;
				mouse.CurEnds[0] = check.from;
				mouse.CurEnds[1] = check.to;
				if( editorState.lockLineOrigin ){
					triangle( check.line.r.o.x, check.line.r.o.y, ( mouse.mouseLock.near === mouse.CurOrigin )?selectedHotSpot:wallOriginColor );
					const end = check.to;
					square( end.x, end.y, ( mouse.mouseLock.near === check.to )?selectedHotSpot:"rgb(255,255,255)" );
					const start = check.from;
					square( start.x, start.y, ( mouse.mouseLock.near === check.from )?selectedHotSpot:"rgb(255,255,255)" );
	
				}else {
					triangle( check.line.r.o.x, check.line.r.o.y, ( mouse.mouseLock.near === mouse.CurOrigin )?selectedHotSpot:wallOriginColor );
					const end = check.to;
					square( end.x, end.y, ( mouse.mouseLock.near === check.to )?selectedHotSpot:"rgb(0,0,0)" );
					const start = check.from;
					square( start.x, start.y, ( mouse.mouseLock.near === check.from )?selectedHotSpot:"rgb(0,0,0)" );
				}
			}
			check = check.next(priorend);
		}while( check !== start )
		// and go back to initial start point


	}

	function DrawDisplayGrid( )
	{
		const GridXUnits = 1; // unit step between lines
		const GridXSets = 10; // bold dividing lines
		const GridYUnits = 1;
		const GridYSets = 10;
		let x, y;
		//maxx, maxy, miny,, incx, incy, delx, dely, minx
		//let start= Date.now();

		let DrawSubLines, DrawSetLines;
		// , drawn
		let units, set;
		let rescale = 1.0;
		let drawnSet = false, drawnUnit = false;
		do
		{
			if( DISPLAY_SCALE( (GridXUnits*rescale) ) > 50 ){
				rescale /= GridXSets;
				DrawSubLines = false; 
				continue;
			}
			DrawSubLines = DrawSetLines = true;
			units = (GridXUnits*rescale);// * display->scale;
			if( DISPLAY_SCALE( units ) < 5 )
				DrawSubLines = false;
			set = (( GridXUnits * GridXSets*rescale ));// * display->scale;
			if( DISPLAY_SCALE( set ) < 5 )
				DrawSetLines = false;
			if( !DrawSubLines )
				rescale *= GridXSets;
		} while( !DrawSubLines );
		
			
		for( x = 0; x < l.w; x++ )
		{
			let real = REAL_X(  x );
			let nextreal = REAL_X(  x+1 );
			let setdraw, unitdraw;
			if( real > 0 )
			{
				setdraw = ( Math.floor(nextreal/set)==Math.floor(real/set));
				unitdraw = ( Math.floor(nextreal/units)==Math.floor(real/units) );
				//Log7( "test: %d %d %d %g %g %d %d", setdraw, unitdraw, x, nextreal, units, (int)(nextreal/units), (int)(real/units) );
			}
			else
			{
				setdraw = ( Math.floor(nextreal/set)!=Math.floor(real/set) );
				unitdraw = ( Math.floor(nextreal/units)!=Math.floor(real/units) );
				//Log7( "test: %d %d %d %g %g %d %d", setdraw, unitdraw, x, nextreal, units, (int)(nextreal/units), (int)(real/units) );
			}

			if( !setdraw )
				drawnSet = false;
			if( !unitdraw )
				drawnUnit = false;

			if( (real <= 0) && (nextreal >= 0) )
			{
				ctx.beginPath();
				ctx.strokeStyle=( "rgba(255,255,255,0.50)")
				ctx.moveTo( x, 0 );
				ctx.lineTo( x, l.h*2 );
				ctx.stroke();
				drawnUnit = true;
				drawnSet = true;
			}
			else if( DrawSetLines && setdraw && !drawnSet )
			{
				ctx.beginPath();
				ctx.strokeStyle=( "rgba(255,255,255,0.375)")
				ctx.moveTo( x, 0 );
				ctx.lineTo( x, l.h*2 );
				ctx.stroke();
				drawnSet = true;
				drawnUnit = true;
			}
			else if( DrawSubLines && unitdraw && !drawnUnit)
			{
				ctx.beginPath();
				ctx.strokeStyle=( "rgba(255,255,255,0.1875)")

				ctx.moveTo( x, 0 );
				ctx.lineTo( x, l.h*2 );
				ctx.stroke();
				drawnUnit = true;
			}
		}
		/*
		if( dotiming ) 
		{
			Log3( "%s(%d): %d Vertical Grid", __FILE__, __LINE__, GetTickCount() - start );
			start = GetTickCount();
		}  
		*/
		drawnSet = drawnUnit = false;
		rescale = 1.0;
		do
		{
			if( DISPLAY_SCALE( (GridYUnits*rescale) ) > 50 ) {
				rescale /= GridYSets;
				DrawSubLines = false; 
				continue;
			}
			DrawSubLines = DrawSetLines = true;
			units = (GridYUnits*rescale);// * display->scale;
			if( DISPLAY_SCALE( units ) < 5 )
				DrawSubLines = false;
			set = (( GridYUnits * GridYSets *rescale));// * display->scale;
			if( DISPLAY_SCALE( set ) < 5 )
				DrawSetLines = false;
			if( !DrawSubLines )
				rescale *= GridYSets;
		} while( !DrawSubLines );

		for( y = l.h - 1; y >= 0 ; y-- )
		//for( y = 0; y < display->pImage->height ; y++ )
		{
			let real = REAL_Y( y );
			let nextreal = REAL_Y( y-1 );
			//RCOORD nextreal = REAL_Y( display, y+1 );
			let setdraw, unitdraw;
			if( real > 0 )
			{
				setdraw = ( Math.floor(nextreal/set)==(Math.floor(real/set)));
				unitdraw = ( Math.floor(nextreal/units)==(Math.floor(real/units)) );
			}
			else
			{
				setdraw = ( (Math.floor(nextreal/set))!=(Math.floor(real/set)) );
				unitdraw = ( (Math.floor(nextreal/units))!=(Math.floor(real/units)) );
			}
			if( !setdraw )
				drawnSet = false;
			if( !unitdraw )
				drawnUnit = false;

			if( (real >= 0) && (nextreal < 0) )
			{
				ctx.beginPath();
				ctx.strokeStyle = "rgba(255,255,255,0.50)";

				ctx.moveTo( 0, y );
				ctx.lineTo( l.w, y );
				ctx.stroke();
				drawnUnit = true;
				drawnSet = true;
			}
			else if( DrawSetLines && setdraw && !drawnSet )
			{
				ctx.beginPath();
				ctx.strokeStyle=( "rgba(255,255,255,0.375)")

				ctx.moveTo( 0, y );
				ctx.lineTo( l.w, y );
				ctx.stroke();
				drawnSet = true;
				drawnUnit = true;
			}
			else if( DrawSubLines && unitdraw && !drawnUnit)
			{
				ctx.beginPath();
				ctx.strokeStyle=( "rgba(255,255,255,0.1875)")

				ctx.moveTo( 0, y );
				ctx.lineTo( l.w, y );
				ctx.stroke();
				drawnUnit = true;
			}
		}
		/*
		if( dotiming )
		{
			Log3( "%s(%d): %d Horizontal Grid", __FILE__, __LINE__, GetTickCount() - start );
			start = GetTickCount();
		}
		*/
	}

	drawCursor();

	// slope
	function triangle(x,y,c)
	{
		ctx.beginPath();
		ctx.strokeStyle = c||"rgb(0,127,0)"
		ctx.moveTo( DISPLAY_X( x ) - 4, DISPLAY_Y(y) + 3 );
		ctx.lineTo( DISPLAY_X( x )  + 4, DISPLAY_Y(y) + 3 );
		ctx.lineTo( DISPLAY_X( x )     , DISPLAY_Y(y) - 3 );
		ctx.lineTo( DISPLAY_X( x )  - 4, DISPLAY_Y(y) + 3 );
		ctx.stroke();	
	}	


	function square(x,y,c)
	{
		ctx.beginPath();
		ctx.strokeStyle = c||"rgb(0,0,127)"
		ctx.moveTo( DISPLAY_X( x )  - 3, DISPLAY_Y(y) - 3 );
		ctx.lineTo( DISPLAY_X( x )  + 3, DISPLAY_Y(y) - 3 );
		ctx.lineTo( DISPLAY_X( x )  + 3, DISPLAY_Y(y) + 3 );
		ctx.lineTo( DISPLAY_X( x )  - 3, DISPLAY_Y(y) + 3 );
		ctx.lineTo( DISPLAY_X( x )  - 3, DISPLAY_Y(y) - 3 );
		ctx.stroke();	
	}	

}

function drawCursor() {
	//if(document.pointerLockElement === l.canvas ||
	//	document.mozPointerLockElement === l.canvas) {
			const near = mouse.mouseLock.near;
			if( near ){

				l.worldCtx.drawImage( l.cursor, DISPLAY_X(near.x)-l.cursorSpot.x, DISPLAY_Y(near.y)-l.cursorSpot.y );
			}
			else
		  //console.log('The pointer lock status is now locked');
		  		l.worldCtx.drawImage( l.cursor, mouse.pos.x, mouse.pos.y );
	  //} else {
		  //console.log('The pointer lock status is now unlocked');
	  //}
}


function setupMenu() {
	const menu = popups.createMenu();
	menu.addItem( "Merge Walls", ()=>option(1) );
	menu.addItem( "Break Wall", ()=>option(2) );
	menu.separate();
	menu.addItem( "More Options?", ()=>option(3) );
	const childMenu = menu.addMenu( "Sub Menu..." );
	childMenu.addItem( "..." );
	menu.addItem( "option 4", ()=>option(4) );
	function option(n) {
		
		console.log( "trigggered option?", n );
	}
	return menu
}

function setupWorld( world ) {
	const editor = new popups.create( "World Editor", app );
	const canvas = l.canvas = document.createElement( "canvas" );
	const popup = setupMenu();
	
	editor.appendChild( canvas );
	
	canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;
	editor.divContent.style.position = "relative";
	canvas.requestPointerLock();

	l.world = world;

	canvas.addEventListener( "wheel", (evt)=>{
		evt.preventDefault();
		if( evt.deltaY > 0 )
		{
			const oldx = REAL_X( mouse.pos.x );
			const oldy = REAL_Y( mouse.pos.y );

			l.scale *= 1.1;
			const newx = REAL_X(mouse.pos.x );
			const newy = REAL_Y( mouse.pos.y );

			l.xOfs += newx - oldx;
			l.yOfs += newy - oldy;
			canvasRedraw();
		}else {
			const oldx = REAL_X( mouse.pos.x );
			const oldy = REAL_Y( mouse.pos.y );
			l.scale /= 1.1;
			const newx = REAL_X(mouse.pos.x );
			const newy = REAL_Y( mouse.pos.y );
			l.xOfs += newx - oldx;
			l.yOfs += newy - oldy;
			canvasRedraw();
		}
	})
	canvas.addEventListener( "mousedown", (evt)=>{
		evt.preventDefault();
		evt.stopPropagation();
		if( (evt.buttons & 2)  || ( (evt.buttons & 1) && editorState.commandClick/*event.metaKey*/ ) ) {
			evt.stopPropagation();
			popup.show( null, evt.clientX, evt.clientY );
		} else {
			var rect = canvas.getBoundingClientRect();
			const x = evt.clientX - rect.left;
			const y = evt.clientY - rect.top;
			mouse.pos.x = x;
			mouse.pos.y = y;
			mouse.rpos.x = REAL_X(x);
			mouse.rpos.y = REAL_Y(y);
			if( mouse.mouseLock.near ){
				mouse.mouseLock.drag = true;
			}else
				mouse.drag = true;
		}
	})

	function Color(r,g,b){
		return `rgb(${r},${g},${b})`
	}


	function  updateWall(pNewWall) {
		if( mouse.CurWall != pNewWall ) {
			// curwall from
			if( mouse.CurEnds[0] )
				if( mouse.mouseLock.to == "CurEnds[0]" ){
					if( mouse.CurEnds[0].equals( pNewWall.to ) ) {
						mouse.mouseLock.near = pNewWall.to;
						mouse.mouseLock.to = "CurEnds[1]";
					}
					if( mouse.CurEnds[0].equals( pNewWall.from ) ) {
						mouse.mouseLock.near = pNewWall.from;
						//mouse.mouseLock.to = "CurEnds[0]";
					}
				}
		
			if( mouse.CurEnds[1] )
				if( mouse.mouseLock.to == "CurEnds[1]" ){
					if( mouse.CurEnds[1].equals( pNewWall.to ) ) {
						mouse.mouseLock.near = pNewWall.to;
						//mouse.mouseLock.to = "CurEnds[1]";
					}
					if( mouse.CurEnds[1].equals( pNewWall.from ) ) {
						mouse.mouseLock.near = pNewWall.from;
						mouse.mouseLock.to = "CurEnds[0]";
					}
				}
				mouse.CurWall = pNewWall;
				mouse.CurWalls.push( pNewWall );
		}

	}


	canvas.addEventListener( "mousemove", (evt)=>{
		var rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;

		const delx = x - mouse.pos.x;
		const dely = y - mouse.pos.y ;
		let o = new Vector( REAL_X(x), REAL_Y(y), 0 );
		let del = new Vector( REAL_SCALE(delx), REAL_SCALE(dely) );
		mouse.isNear(o,del);
		canvasRedraw();
		//console.log( "Del:", del, delx, dely );
		DrawLine( del, o,-1.0,1.0, "rgb(255,255,255)" );

		if( delx > 0 )
			mouse.delxaccum ++;
		else if( delx < 0 )
			mouse.delxaccum--;
		if( dely > 0 )
			mouse.delyaccum ++;
		else if( dely < 0 )
			mouse.delyaccum--;

		const rx = REAL_SCALE( x - mouse.pos.x);
		const ry = REAL_SCALE( y - mouse.pos.y);

		if( mouse.drag ) {
			// this is dragigng the background coordinate system.
			l.xOfs += rx;
			l.yOfs += ry;
		}
		if( mouse.mouseLock.drag && mouse.mouseLock.near ) {
			const t = (mouse.mouseLock.to === "CurSecOrigin")?"S"
				:(mouse.mouseLock.to === "CurEnds[0]")?"e0"
				:(mouse.mouseLock.to === "CurEnds[1]")?"e1"
				:(mouse.mouseLock.to === "CurSlope")?"s"
				:(mouse.mouseLock.to === "CurOrigin")?"o":"''";
				if( !t ) {
					console.log( "Seelction not found?", mouse.mouseLock.to );
				}
			// initial offset of newly created wall is realtive to My scale...
			console.log( "Sending a type of move...", t, mouse.CurWall?mouse.CurWall.id:-1);
			l.ws.send( `{op:move,t:${t},id:${mouse.CurSector&&mouse.CurSector.id},wid:${mouse.CurWall?mouse.CurWall.id:-1},scale:${l.scale},lockCreate:${editorState.lockCreate},lockSlope:${editorState.lockSlope},lockLineOrigin:${editorState.lockLineOrigin},x:${rx},y:${ry}}`)
		}

		else {
			if( !(  mouse.flags.bMarkingMerge 
				|| mouse.flags.bSelect
				|| mouse.flags.bLocked ) )
		  {
			  function LockTo(what,extratest, boolvar)	{
				  if( what )
					if( (x > (what.x - 4 )) && 
						(x < (what.x + 4 )) &&		 
						(y > (what.y - 4 )) &&		 
						(y < (what.y + 4 )) &&		 
						extratest )									 
					{														
						mouse.flags[boolvar] = true;			 
						mouse.flags.bLocked = true;			 
						mouse.pos.x = what.x; 
						mouse.pos.y = what.y;						 
						//SetFrameMousePosition( pc, x, y );
						return true;
					}
					return false;
				}
			  if(!( LockTo( mouse.CurSecOrigin, true, 'bSectorOrigin' )
			  	||LockTo( mouse.CurOrigin, true, 'bOrigin' )
			    ||LockTo( mouse.CurSlope, editorState.lockLineOrigin, 'bSlope' )
			    ||LockTo( mouse.CurEnds[0], !editorState.lockLineOrigin,'CurEnds[0]' )
			    ||LockTo( mouse.CurEnds[1], !editorState.lockLineOrigin,'CurEnds[1]' )
			  ))

			  if( !mouse.flags.bNormalMode )
			  {
				let pNewWall;
				let ps = null;
  
				if( !mouse.flags.bSectorList 
				   && !mouse.flags.bWallList )
				{
					let draw = false;
  
					  if( mouse.CurSector  )
					  {
						pNewWall = mouse.CurSector.findWall( del, o );
						if(  pNewWall && ( pNewWall !== mouse.CurWall ) ) 
						{
							updateWall( pNewWall );
							//BalanceALine( mouse.pWorld, GetWallLine( mouse.pWorld, pNewWall ) );
							draw = true;
						}
					} else if( mouse.priorCurrentSector  ) {
						pNewWall = mouse.priorCurrentSector.findWall( del, o );
						if( pNewWall && ( pNewWall !== mouse.CurWall ) ) 
						{
							updateWall( pNewWall );
							//BalanceALine( mouse.pWorld, GetWallLine( mouse.pWorld, pNewWall ) );
							draw = true;
						}
					  } else {

					  }
					  //else
					  //	lprintf( "no current sector..." );
  
					  o.x = REAL_X( x );
					  o.y = REAL_Y( y );

					if( !( ps = mouse.CurSector ) ||
						!( ps.contains( o ) ) )
							ps = l.world.getSectorAround( o );

							
					  if( ps  && ( ps != mouse.CurSector ) )
					  {
						  //console.log( "marking new current sector? " );
						  mouse.CurSecOrigin = ps.r.o;
						  mouse.CurSector = ps;
						  mouse.CurSectors.push( mouse.CurSector );
  
						  mouse.nWalls = 1;
  
						  if( mouse.CurWall &&
								!mouse.CurSector.has( mouse.CurWall ) ){
							  //mouse.CurWall = mouse.CurWall.into;
							  //console.log( "Also set a wall here...2")
							}else						   {
							  //mouse.CurWall = ps.wall;
							  //console.log( "Also set a wall here...")
							}
							mouse.CurWalls.length = 0;
						  	mouse.CurWalls.push( mouse.CurWall );
						  /*
						  BalanceALine( mouse.pWorld, mouse.CurWall
							  , GetWallLine( mouse.pWorld, mouse.CurWall ) 
							  , 
							  );
							  */
						  draw = true;
					  }else {
						  if( !ps && mouse.CurSector ){
							  draw = true;
							  mouse.priorCurrentSector = mouse.CurSector;
							  mouse.CurSector = null;
							  mouse.CurSectors.length = 0;
						  }
					  }
					  if( draw )
						  canvasRedraw( );
				  } 
			  }
		  }	
  
		}

		mouse.pos.x = x;//mouse.x + (x-mouse.x)/2;
		mouse.pos.y = y;//mouse.y + (y-mouse.y)/2;
		mouse.rpos.x = REAL_X(x);
		mouse.rpos.y = REAL_Y(y);
	})
	canvas.addEventListener( "mouseup", (evt)=>{
		mouse.drag = false;
		mouse.mouseLock.drag = false;
	})

	document.body.addEventListener( "keydown", (evt)=>{
		console.log( "key:", evt );
		cs.value =  evt.shiftKey;
		lo.value =  evt.ctrlKey;
		cmd.value = evt.metaKey

		if( evt.code === "Tab" ) {
			evt.preventDefault();
			ld.value = !ld.value;
		}
	})
	document.body.addEventListener( "keyup", (evt)=>{
		console.log( "key:", evt );
		cs.value =  evt.shiftKey;
		lo.value =  evt.ctrlKey;
		cmd.value = evt.metaKey

		if( evt.code === "Tab" ) {
			evt.preventDefault();
			//ld.value = !ld.value;
		}
	})

	canvas.addEventListener('contextmenu', function(evt){
		evt.preventDefault();
		evt.stopPropagation();
   	 return false;
	}); 
	l.w = canvas.width = 1024;
	l.h = canvas.height = 768;
	l.xOfs = (l.w/2)*l.scale;
	l.yOfs = (l.h/2)*l.scale;
	
	l.worldCtx= canvas.getContext( "2d" );

	editor.appendChild( canvas );
	const toggles = document.createElement( "div" );
	toggles.style.position = "absolute";
	toggles.style.left = 0;
	toggles.style.top = 0;
	const cmd = popups.makeCheckbox( toggles, editorState, "commandClick", "⌘");
	//cmd.on("change",canvasRedraw);
	const lo = popups.makeCheckbox( toggles, editorState, "lockLineOrigin", "Lock Origin");
	lo.on("change",canvasRedraw);
	const cs = popups.makeCheckbox( toggles, editorState, "lockCreate", "Create Sector");
	cs.on("change",canvasRedraw);
	const ls = popups.makeCheckbox( toggles, editorState, "lockSlope", "Lock Slopes");
	ls.on("change",canvasRedraw);

	const ld = popups.makeCheckbox( toggles, editorState, "lockDrag", "Lock Drag");
	//ld.on("change",canvasRedraw);


	editor.appendChild( toggles )

	canvasRedraw();
	console.log( "Okay world data:", world.name );
	return editor;
}

function dispatchChanges( ) {
	if( l.refresh ) {
		canvasRedraw();
		//for( let update of l.updates )
		//	update.on( "flush" );
		//l.updates.length = 0;
		l.refresh = false;
	}
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
		l.editor = setupWorld( msg.world );
	} else if( msg.op === "deleteWorld" ) {
		selector.delWorld( msg.world );
	} else if( msg.op === "newWorld" ) {
		console.log( "add World Live" );
		l.editor = selector.addWorld( msg.world );
	} else if( msg.op === "Line" ) {
		// update line message (from world update?)
		l.refresh = true;
		l.world.lines[msg.id].set(msg.data);
	} else if( msg.op === "line" ) {
		// create line message....
		l.refresh = true;
		l.world.lines[msg.id].set(msg.data);
	} else if( msg.op === "Sector" ) {
		l.world.sectors[msg.id].set(msg.data);
		l.refresh = true;
	} else if( msg.op === "wall" ) {
		l.world.walls[msg.id].set(msg.data);
	} else if( msg.op === "create" ) {
		console.log( "Create is mostly unimplemented:", msg );
		if( msg.sub === "sector" ) {
		}	
	} else if( msg.op === "use" ) {
		if( msg.t === "W" ) {
			mouse.CurWalls.length = 0;
			mouse.CurWalls.push( l.world.walls[msg.id] );
		}
	} else if( msg.op === "move" ) {
		if( msg.t === "S" ) {
			// sector
			l.world.sectors[msg.id].move(msg.x,msg.y);
		}
		if( msg.t === "n" ) {
			// slope
		}
		if( msg.t === "o" ) {
			// wall origin
		}
	} else if( msg.op === "error" ) {
	  	console.log( "ERROR:", msg );
	} else {
		console.log( "Unhandled:", msg );
	}
}


function processImage( image, r,g,b ) {
	const gameBoard = document.createElement( "canvas" );
	const gameCtx = gameBoard.getContext( "2d" ) ;
	gameBoard.width = image.width;
	gameBoard.height = image.height;
	gameCtx.fillStyle = "transparent";
	gameCtx.fillStroke = "transparent";
	gameCtx.clearRect( 0, 0, 500, 500 );
	var myImageData = gameCtx.getImageData(0, 0, image.width, image.height);
	gameCtx.drawImage(image, 0, 0);
	var myImageData = gameCtx.getImageData(0, 0, image.width, image.height);
	var outImageData = gameCtx.createImageData(image.width, image.height);
	var numBytes = myImageData.data.length;
	for( n = 0; n < numBytes; n+=4 ) {
		outImageData.data[n+0] = 255-myImageData.data[n+0];
		outImageData.data[n+1] = 255-myImageData.data[n+1];
		outImageData.data[n+2] = 255-myImageData.data[n+2];
		// keep same alpha mask, just invert color channels.
		outImageData.data[n+3] = myImageData.data[n+3];
	}
	gameCtx.putImageData(outImageData, 0, 0)
	var image = new Image();
	image.src = gameBoard.toDataURL();
	return image;
}


function newImage(src) {  
	return new Promise( (res,rej)=>{
	var i = new Image();
	i.crossOrigin = "Anonymous";
	i.src = src;
	requiredImages.push( i );
	i.onload = ()=>{
		const idx = requiredImages.findIndex( img=>img===i);
		if( idx >= 0 ) requiredImages.splice( idx, 1 );
			res(i);
			//DOM_text.innerHTML = "Loading... " + (100 - 100*requiredImages.length / maxRequired );
			//if( requiredImages == 0 ) doWork(); };
	};
	i.onerror = ()=>{
		const idx = requiredImages.findIndex( img=>img===i);
		if( idx >= 0 ) requiredImages.splice( idx, 1 );
		rej(i);
	}
	
	})
}

