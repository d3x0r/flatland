
const surface = document.getElementById( "testSurface" );
const app = document.getElementById( "AppContainer" );

import {JSOX} from "./jsox.js" 
import {popups,Popup} from "./popups.js"

import {classes,Vector} from "./flatland.classes.mjs"
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

let mouse = {x:0,y:0,drag:false
	, delxaccum : 0
	, delyaccum : 0

	, CurSecOrigin : new Vector()
	, CurOrigin : new Vector()
	, CurSlope : null
	, CurSector : null
	, CurSectors : []
	, CurWall:null
	, CurWalls : []
	//, 
	, CurEnds : [null,null]
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
};


function canvasRedraw() {


	const ctx = l.worldCtx

	ctx.clearRect( 0, 0, l.w, l.h );
	DrawDisplayGrid();
//	ctx.
	for( let sector of l.world.sectors ){
		const o = sector.origin;
		if( sector === mouse.CurSector ) {
			triangle( o.x, o.y, selectedSectorStroke );
		}
		else
			triangle( o.x, o.y, unselectedSectorStroke );



		let start = sector.wall;
		let check = start;
		let prior = null;
		const priorend = [true];
		let pt = start.from;

		// draw the walls.
		do {
			ctx.beginPath();
			if( sector === mouse.CurSector ){
				if( check === mouse.CurWall )
					ctx.strokeStyle = selectedWallStroke;
				else
					ctx.strokeStyle = unselectedWallStroke;
			} else
				if( check === mouse.CurWall )
					ctx.strokeStyle = selectedWallStroke;
				else
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

	canvas.addEventListener( "wheel", (evt)=>{
		evt.preventDefault();
		if( evt.deltaY > 0 )
		{
			const oldx = REAL_X( mouse.x );
			const oldy = REAL_Y( mouse.y );

			l.scale *= 1.1;
			const newx = REAL_X(mouse.x );
			const newy = REAL_Y( mouse.y );

			l.xOfs += newx - oldx;
			l.yOfs += newy - oldy;
			canvasRedraw();
		}else {
			const oldx = REAL_X( mouse.x );
			const oldy = REAL_Y( mouse.y );
			l.scale /= 1.1;
			const newx = REAL_X(mouse.x );
			const newy = REAL_Y( mouse.y );
			l.xOfs += newx - oldx;
			l.yOfs += newy - oldy;
			canvasRedraw();
		}
	})
	canvas.addEventListener( "mousedown", (evt)=>{
		var rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		mouse.x = x;
		mouse.y = y;
		mouse.drag = true;
	})

	function Color(r,g,b){
		return `rgb(${r},${g},${b})`
	}

	function DrawLine(display, d,o,from,to, c ){
		const ctx = l.worldCtx;
		ctx.beginPath();
		ctx.strokeStyle = c
		ctx.moveTo( DISPLAY_X( o.x + d.x * from), DISPLAY_Y( o.y + d.y * from) );
		ctx.lineTo( DISPLAY_X( o.x + d.x * to), DISPLAY_Y( o.y + d.y * to) );
		ctx.stroke();	
	}
	classes.setDrawLine(DrawLine);

	canvas.addEventListener( "mousemove", (evt)=>{
		var rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;

		const delx = x - mouse.x;
		const dely = y - mouse.y ;
		let o = new Vector( REAL_X(x), REAL_Y(y), 0 );
		let del = new Vector();
		canvasRedraw();
		 DrawLine(0, o, del,0.9,1.1, "rgb(255,255,255)" );

		if( delx > 0 )
			mouse.delxaccum ++;
		else if( delx < 0 )
			mouse.delxaccum--;
		if( dely > 0 )
			mouse.delyaccum ++;
		else if( dely < 0 )
			mouse.delyaccum--;


		if( mouse.drag ) {
			// this is dragigng the background coordinate system.
			l.xOfs += REAL_SCALE( x - mouse.x);
			l.yOfs += REAL_SCALE( y - mouse.y);
			canvasRedraw()
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
						x = what.x; 
						y = what.y;						 
						//SetFrameMousePosition( pc, x, y );
						return true;
					}
					return false;
				}
			  if(!( LockTo( mouse.CurSecOrigin, true, 'bSectorOrigin' )
			  	||LockTo( mouse.CurOrigin, true, 'bOrigin' )
			  //||LockTo( mouse.CurSlope, IsKeyDown( display->hVideo, KEY_SHIFT ), 'bSlope' )
			  //||LockTo( mouse.CurEnds[0], !IsKeyDown( display->hVideo, KEY_SHIFT ),bEndStart )
			  //||LockTo( mouse.CurEnds[1], !IsKeyDown( display->hVideo, KEY_SHIFT ),bEndEnd )
			  ))

			  if( !mouse.flags.bNormalMode )
			  {
				  var pNewWall;
				  var ps = null;
  
				  if( !mouse.flags.bSectorList &&
					   !mouse.flags.bWallList )
				  {
					  var draw = false;
  
					  if( mouse.CurSector  )
					  {
						  o.x = REAL_X(  mouse.x );
						  o.y = REAL_Y(  mouse.y );
						  del = new Vector( REAL_SCALE(  delx ), REAL_SCALE(  dely ) );

						  del.scale( 3 );
  
						  del.y = -del.y;
							//console.log( "DEL:", del, mouse.x, x )
						  //DrawLine( 0, del, o, 0, 1, Color( 90, 90, 90 ) );
  
						  pNewWall = mouse.CurSector.findWall( del, o );
						  if(  pNewWall && ( pNewWall !== mouse.CurWall ) ) 
						  {
							  // this bit of code... may or may not be needed...
							  // at this point a sector needs to be found
							  // before a wall can be found...
							  //display->nWalls = 1;
							  //display->CurWallList = &mouse.CurWall;
							  console.log( "Set wall:", pNewWall )
							  mouse.CurWall = pNewWall;
							  //BalanceALine( mouse.pWorld, GetWallLine( mouse.pWorld, pNewWall ) );
							  draw = true;
						  }			  
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
						  console.log( "marking new current sector? " );
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

		mouse.x = x;//mouse.x + (x-mouse.x)/2;
		mouse.y = y;//mouse.y + (y-mouse.y)/2;
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


