
const surface = document.getElementById( "testSurface" );
const app = document.getElementById( "AppContainer" );

import {JSOX} from "./jsox.js" 
import {popups,Popup} from "./popups.js"

import {classes} from "./flatland.classes.mjs"

classes.setDecoders( JSOX );

const l = {
	world : null,
	scale : 0.05, 
	ws : null, // active connection to server.
	worldCtx : null, // world editor default context
	xOfs : 0,
	yOfs : 0,
	w : 0,
	h : 0,
	selectedSector : null,
	selectedWall : null,
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


const selectedSectorStroke = "rgb(0,127,0)";
const selectedWallStroke = "rgb(0,127,0)";
const selectedWallEndStroke = "rgb(0,127,0)";

const gridWhiteLine = "rgba(255,255,255,64)";

function DISPLAY_SCALE(x)  { return x /l.scale}
function DISPLAY_X(x)  { return DISPLAY_SCALE( x + l.xOfs )  }
function DISPLAY_Y(y)  { return DISPLAY_SCALE( y + l.yOfs ) }

function REAL_SCALE(x) { return x * l.scale;}
function REAL_X(x) { return REAL_SCALE(  x  )- l.xOfs}
function REAL_Y(y) { return REAL_SCALE(  y  )- l.yOfs}



function canvasRedraw() {


	const ctx = l.worldCtx

	ctx.clearRect( 0, 0, l.w, l.h );
	DrawDisplayGrid();
//	ctx.
	for( let sector of l.world.sectors ){
		const o = sector.origin;
		if( sector === l.selectedSector ) {
			triangle( o.x, o.y, selectedSectorStroke );
		}

		let start = sector.wall;
		let check = start;
		const priorend = [true];
		let pt = start.from;

		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
		do {
			let pt = check.to;
			ctx.lineTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );

			check = check.next(priorend);
		}while( check != start )
		// and go back to initial start point
		ctx.lineTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );	
		ctx.stroke();	

		pt = start.from;
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,0)"
		ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
		do {
			triangle( check.line.r.o.x, check.line.r.o.y );
			const end = check.to;
			square( end.x, end.y );
			const start = check.from;
			square( start.x, start.y );

			check = check.next(priorend);
		}while( check != start )
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
			DrawSubLines = DrawSetLines = true;
			units = (GridXUnits*rescale);// * display->scale;
			if( DISPLAY_SCALE( units ) < 5 )
				DrawSubLines = false;
			set = (( GridXUnits * GridXSets*rescale ));// * display->scale;
			if( DISPLAY_SCALE( set ) < 5 )
				DrawSetLines = false;
			if( !DrawSubLines )
				rescale *= 2;
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
			DrawSubLines = DrawSetLines = true;

			units = (GridYUnits*rescale);// * display->scale;
			if( DISPLAY_SCALE( units ) < 5 )
				DrawSubLines = false;
			set = (( GridYUnits * GridYSets *rescale));// * display->scale;
			if( DISPLAY_SCALE( set ) < 5 )
				DrawSetLines = false;
			if( !DrawSubLines )
				rescale *= 2;
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
				console.log( "MIDDLE!")
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

	// slope
	function triangle(x,y,c)
	{
		ctx.beginPath();
		ctx.strokeStyle = c||"rgb(0,127,0)"
		ctx.moveTo( DISPLAY_X( x ) - 3, DISPLAY_Y(y) + 2 );
		ctx.lineTo( DISPLAY_X( x )  + 3, DISPLAY_Y(y) + 2 );
		ctx.lineTo( DISPLAY_X( x )     , DISPLAY_Y(y) - 2 );
		ctx.lineTo( DISPLAY_X( x )  - 3, DISPLAY_Y(y) + 2 );
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


function setupWorld( world ) {
	const selector = new popups.create( "World Editor", app );
	const canvas = document.createElement( "canvas" );
	l.world = world;

	let mouse = {x:0,y:0,drag:false};
	canvas.addEventListener( "mousedown", (evt)=>{
		mouse.x = evt.clientX;
		mouse.y = evt.clientY;
		mouse.drag = true;
	})
	canvas.addEventListener( "mousemove", (evt)=>{
		if( mouse.drag ) {
			l.xOfs += REAL_SCALE( evt.clientX - mouse.x);
			l.yOfs += REAL_SCALE( evt.clientY -mouse.y);
			canvasRedraw()
		}
		mouse.x = evt.clientX;
		mouse.y = evt.clientY;
	})
	canvas.addEventListener( "mouseup", (evt)=>{
		mouse.drag = false;
	})

	l.w = canvas.width = 1024;
	l.h = canvas.height = 768;
	l.xOfs = (l.w/2)*l.scale;
	l.yOfs = (l.h/2)*l.scale;
	
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


