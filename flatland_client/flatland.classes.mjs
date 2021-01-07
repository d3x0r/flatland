
let drawLine = null;
//import {JSOX} from "jsox"
import {JSOX} from "../node_modules/jsox/lib/jsox.mjs"
let util = {format(...a) { return (a).join( ' ' ) } };
//if( "undefined" === typeof window )
//	import('util').then( u=>util = u );

const _debug_revive = false;
const _debug_events = false;
const _debug_mating_update = false;

const localParseState = {
	world : null,
	
};

class Pool {
	#events = {};
	#free = [];
	#used = [];
	#class = null;
	parent = null;
	constructor( parentEventHandler, type ) {
		this.#class = type;
		this.parent = parentEventHandler;
	}
	get( id, opts ) {
		if( id === undefined ) {
			
		} else if( "object" === typeof id ) {
			opts = id;
			id = null;
		} else {
			let r = this.#used[id];
			if( !r ) {
				const fr = this.#free.findIndex( member=>member.id === id );
				if( fr >= 0 ) {
					r = this.#free[fr];
					this.#free.splice( fr, 1 );
					this.#used[id] = r;
				}
				if( opts ) {
					r.set( opts );
				} else
					throw new Error( "Existing object does not exist in pool.");
			} else {
				if( opts ) 
					r.set( opts );
			}
			return r;
		}
		if( this.#free.length ){
			const r = this.#free.pop();
			opts && r.set( opts );
			this.#used[r.id] = r;
			this.parent.on("create", r );
			return r;
		}else {
			const r = new this.#class(this,opts);
			r.id = this.#used.length;
			this.#used.push(r);
			this.parent.on("create", r );
			return r;
		}
	}
	// for each empty spot, move a used entry.
	pack() {
		let lastUsed;
		let cache = [];
		while( this.#free.length ) {
			let n;
			for( n = this.#used.length-1; n > 0; n-- ) 
				if( lastUsed = this.#used[n] ) break;
			const free = this.#free.pop();
			if( free.id < lastUsed ){
				this.#used[free.id] = lastUsed;
				this.#used[n] = null;
				lastUsed.id = free.id;
				cache.push(free);
				free.id = n; // drops this node anyway...
			}
		}
		this.#free = cache;
	}
	move( member, to ) {
		if( this.#used[to] ) throw new Error( "ID is already in use." );
		this.#used[member.id] = null;
		this.#used[to] = member;
	}
        get array() {
        	return this.#used;
        }
        toObject() {
        	return this.#used;
        }
	drop( w ) {
		this.#free.push(w);
		this.#used[w.id] = null;
		this.parent.on("destroy", w );
	}

	on( event, data, data2 ) {
		if( "function" === typeof data ) {
			//console.log( "REGSITERING EVENT IN", event );
			const newEvent = {cb:data,param:data2};
			if( event in this.#events )
				this.#events[event].push( newEvent );
			else
				this.#events[event] = [newEvent];
		}
		else{
			//console.log( "USING EVENT", event );
			
			if( event in this.#events ) {
				let result = null;
				this.#events[event].forEach( cb=>{ 
					const zz = cb.cb.call(cb.param,data,data2);
					if( result ) result = [result].push(zz);
					else result = zz;
				} );
				//console.log( "on event result:", result );
				return result;
			}
		}
	}
}

class PoolMember {
	#id = -1;
	#pool = null;
	#set = null;
	get id() {
		return this.#id;
	}
	set id( val ) {
		if( this.#id < 0 ) this.#id = val;
		else {
			if( this.#id !== val ) {
				console.log( "moving pool member manually" );
				this.#set.move( this, val );
				this.#id = val; // successfully moved to the new spot...
			}
		}
	}
	on( name,val ) {
		return this.#set.on(name,this,val);
	}
	get parent() {
		return this.#set.parent;
	}
	constructor( set ) {
		this.#set = set;
	}
}

class NameSet extends Pool {

	constructor(parent) {
		super( parent, Name );
	}

}

class NameMsg{
	name = localParseState.world.getName();
}
function buildNamefromJSOX( field,val ) {
	if( !field ) return this.name;
	_debug_revive && console.log( "revive name field:", field );
	switch( field ) {
	case "flags":
		return this.name.flags;
	case "id":
		_debug_revive && console.log("OVERRIDE ID?", val, this.name.id );
		this.name.id = val;
		return undefined;
	case "name":
		this.name.name = val;
		return undefined;
	} 
}


class Name extends PoolMember {
	static #autoid = 1;
	flags = { vertical : false };
	name = '';
	#set = null;
	// craete/allocate
	constructor(set, opts) {
		super( set );
		this.name = opts.name || ("Name " + Name.#autoid++);
	}

	set(opts) {
		this.name = opts.name;
	}

}

//--------------------------------------------

class TextureSet extends Pool {
	constructor(parent) {
		super( parent, Texture );
	}

}

class TextureMsg {
	texture = localParseState.world.getTexture();
	name = null;
	flags = null;
}
function buildTexturefromJSOX( field,val ) {
	if( !field ) return this.texture.set( this );
	_debug_revive && console.log( "revive texture ield:", field );
	switch( field ) {
	case "flags":
		return this.texture.flags;
	case "name":
		this.texture.name = val;
		return val;
	default:
		return undefined;
	} 
}


class Texture extends PoolMember{
	flags = { color : true };
	color = null;
	name = null;

	constructor(set) {
		super(set, Texture)
	}
	set(v) {
		this.color = v.color;
		this.name = v.name;
		return this;
	}
			
	SetSolidColor(c) {
		this.color = c;
	}

};

function AColor(r,g,b,a)
{

}
//--------------------------------------------

class Vector {
	x = 0;
        y = 0;
		z = 0;
		constructor(a,b,c) {
			if( "number" === typeof a ) {
				this.x = a;
				this.y = b;
			}
			if( "number" === typeof c ) {
					this.z = c;
			}
		}
	set(v) { 
		if( isNaN( v.x ) ) {
			console.trace( "found Nan setting vector", this, v );
		}
		this.x = v.x; this.y = v.y;this.z = v.z;
		return this;}
	sum(v ) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}
	sub(a,b ) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		return this;
	}
	add(a,b ) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		return this;
	}
	scale(t ) {
		this.x *= t;
		this.y *= t;
		this.z *= t;
		return this;
	}
	addScaled( a, b, t ) {
		this.x = a.x + b.x * t;
		this.y = a.y + b.y * t;
		this.z = a.z + b.z * t;
		return this;
	}
	crossproduct(a,b) {
		this.x = a.y*b.z - a.z*b.y;
		this.y = a.z*b.x - a.x*b.z;
		this.z = a.x*b.y - a.y*b.x;
	}
}

//--------------------------------------------

class Ray {
	o = new Vector();
	n = new Vector();
	constructor( o, n ){
		if( o ) {
			this.o = o;
			this.n = n;
		}
	}
	set(opts ) {
		this.o.set( opts.o );
		this.n.set( opts.n );
		if( !opts.n.x && !opts.n.y && !opts.n.z )
			debugger;
		return this;
	}
}

//--------------------------------------------
function NearValue(n,m) {
	return Math.abs( n - m ) < 0.00001;
}
function Near(n,m) {
	return NearValue(n.x,m.x) && NearValue(n.y,m.y) && NearValue(n.z,m.z);
}
const paranoidIntersectionTest = 0;
const intersectionResult = {t1:0,t2:0};
function FindIntersectionTime(  s1,  o1, s2,  o2 )
{
	const na = (s1.x)
	const nb = (s1.y)
	const nc = (s1.z)

	const nd = (s2.x)
	const ne = (s2.y)
	const nf = (s2.z)	
	if( ( !na && !nb && !nc )||( !nd && !ne && !nf ) )
		return null;
	  
	let denoms = new Vector();
	let t1, t2, denom;

	const a = (o1.x);
	const b = (o1.y)
	const c = (o1.z)

	const d = (o2.x)
	const e = (o2.y)
	const f = (o2.z)

	
	denoms.crossproduct( s1, s2 ); // - (negative) result..
	denom = denoms.z;
	if( NearValue( denom,0 ) )
	{
		denom = denoms.y;
		if( NearValue( denom,0 ) )
		{
			denom = denoms.x;
			if( NearValue( denom, 0 ) )
			{
				//console.log( "Bad!-------------------------------------------\n" );
				return null;
			}
			else
			{
				t1 = ( ne * ( c - f ) + nf * ( e - b ) ) / denom;
				t2 = ( nb * ( c - f ) + nc * ( e - b ) ) / denom;
			}
		}
		else
		{
			t1 = ( nd * ( f - c ) + nf * ( a - d ) ) / denom;
			t2 = ( na * ( f - c ) + nc * ( a - d ) ) / denom;
		}
	}
	else
	{
		t1 = ( nd * ( b - e ) + ne * ( d - a ) ) / denom;
		t2 = ( na * ( b - e ) + nb * ( d - a ) ) / denom;
	}
	if( paranoidIntersectionTest ) {
		let R1 = new Vector(), R2 = new Vector();
		R1.addScaled( o1, s1, t1 );
		R2.addScaled( o2, s2, t2 );
		if( !Near(R1,R2) )
			return null;
	}

	intersectionResult.t2 = t2;
	intersectionResult.t1 = t1;
	return intersectionResult;
}

class LineSet extends Pool {
	constructor(parent) {
		super( parent, Line )
	}

}
class LineMsg {
	line = localParseState.world.getLine( );
		
	r = null;
	f = 0;
	t = 0;
}
function buildLinefromJSOX( field,val ) {
	try {
		if( !field ) return this.line;
		_debug_revive && console.log( "revive line f ield:", field );
		switch( field ) {
		case "from":
			this.line.from = val;
			break;
		case "id":
			this.line.id = val;
			break;
		case "r":
			return this.line.r = val;
			break;
		case "to":
			this.line.to = val;
			break;
		} 
	}catch(err) {
		console.log( "Line failure:", err );
	}
}

class Line extends PoolMember{
	r = new Ray();
	from = -Infinity;
	#pFrom = new Vector();
	to = Infinity;
	#pTo = new Vector();
	#flags = { 
		updated : false
	}
	
	constructor( set, opts ) {
		super( set );
		opts && this.set(opts)
	}
	toJSOX() {
		if( !this.r.n.x&& !this.r.n.y &&!this.r.n.z )
			debugger;
		return JSOX.stringify( {id:this.id,r:this.r, t:this.to,f:this.from});
	}
	set( opts ) {
		if( opts instanceof Line ){
			if( isNaN( opts.r.n.x ) ) {
				console.trace( "Found NaN");
			}
			this.r.set( opts.r );
			this.from = opts.from;
			this.to = opts.to;
		}
		else if( opts.line && opts.line instanceof Line ){
			this.r.set( opts.ray.r );
			this.from = opts.f;
			this.to = opts.t;
			return this;
		} 

		else if( "id" in opts ) { 
			if( opts.id !== this.id ) throw new Error( "Mismatch ID");
			this.r.set( opts.r );
			this.from = opts.f;
			this.to = opts.t;
		}else {
			this.r = opts.ray;
			if( "number" === typeof opts.from ) {
				this.from = opts.from;
				this.to = opts.to;
			}
			this.#flags.updated = true;
			this.on( "update", this );
		}
		return this;
	}

	get ptFrom() {
		return this.#pFrom.addScaled( this.r.o, this.r.n, this.from );
	}
	get ptTo() {
		return this.#pTo.addScaled( this.r.o, this.r.n, this.to );
	}
	intersect( bEnd1, pLine2, bEnd2 )
	{
		const pLine1 = this;
		// intersects line1 with line2
		// if bEnd1 then update pLine1.to else pLine1.from
		// if bEnd2 then update pLine2.to else pLine2.from
		let r = FindIntersectionTime(  pLine1.r.n, pLine1.r.o
									 , pLine2.r.n, pLine2.r.o );
		console.log( "Result ", r );
		 if( !r )
		{
			console.log( "Intersect N<%g,%g,%g> O<%g,%g,%g> with N<%g,%g,%g> O<%g,%g,%g>", 
								pLine1.r.n.x, 
								pLine1.r.n.y, 
								pLine1.r.n.z, 
								pLine1.r.o.x, 
								pLine1.r.o.y, 
								pLine1.r.o.z, 
								pLine2.r.n.x, 
								pLine2.r.n.y, 
								pLine2.r.n.z, 
								pLine2.r.o.x, 
								pLine2.r.o.y, 
								pLine2.r.o.z );

			console.log( "End Flags: %d %d", bEnd1, bEnd2 );
		}
		if( r )
		{
			console.log( "SETtting", bEnd1, bEnd2 )
			if( bEnd1 ){
				console.log( "set line1 to:", r.t1 );
				pLine1.to = r.t1;
			}
			else{
				console.log( "set line1 from:", r.t1 );
				pLine1.from = r.t1;
			}
	
			if( bEnd2 ){
				console.log( "set line2 to:", r.t2 );
				pLine2.to = r.t2;
			}
			else{
				console.log( "set line2 from:", r.t2 );
				pLine2.from = r.t2;
			}
			return true;
		}
		else
		{
			// what to do if specified lines do not intersect?
			return false;
		}
	}
	
};

Line.makeOpenLine = function( r ) {
	return new Line( { ray:r, from:-Infinity, to:Infinity } );
}

//--------------------------------------------

function ASSERT(e) {
	if( !e ) throw new Error( "Condition is false..");
}

class WallSet extends Pool {
	constructor(parent) {
		super( parent, Wall );

	}

}

class WallMsg {
	end = null;
	end_at_end =false;
	wall = localParseState.world.getWall();
	start = null;
	start_at_end = false;
}

function buildWallfromJSOX( field,val ) {
	if( !field ) return this.wall;
	_debug_revive && console.log( "revive wall field:", field, val );
	switch( field ) {
	case "end":
		if( "undefined" === typeof val ) {
				console.log( "end wall is passed undefined. ");
				debugger;
		}
		_debug_revive && console.log( "WALL END SET TO :", val );
		this.end = val;
		if( val instanceof WallMsg )
			this.wall.end = val.wall;
		else
			this.wall.end = val;
		break;
	case "end_at_end":
		this.end_at_end = val;
		break;
	case "id":
		this.wall.id = val;
		break;
	case "line":
		this.line = val;
		if( val instanceof LineMsg )
			this.wall.line = val.line;
		else
			this.wall.line = val;
		break;
	case "into":
		this.into = val;
		this.wall.into = val && val;
		break;
	case "start":
		this.start = val;
		if( val instanceof WallMsg )
		this.wall.start = val.wall;
		else
		this.wall.start = val;
		break;
	case "start_at_end":
		this.wall.start_at_end = val;
		break;
	} 
	return undefined;
}

function sectorToJSOX(stringifier ) {
	return stringifier.stringify( this );
}

function wallToJSOX(stringifier) {
	const keys = Object.keys( this );
	keys.push( "id" );
	const mirror = {};
	for( let key of keys ) mirror[key] = this[key];
	//console.log( "Stringify wall mirror:", mirror );
	return stringifier.stringify( mirror );
}


class Wall extends PoolMember{
	#flags = {
		bUpdating : false, // set this while updating to prevent recursion..
	   	detached : false, // joined by joined FAR
		   bSkipMate: false, // used when updating sets of lines - avoid double update mating walls
		   dirty : true,
	};
    //#world = null;
    #sector = null;
    //name = null;
    line = null;
    into = null; // mate - to new sector

    start = null; // in same sector, mating wall
	start_at_end = false; // wall_at_start links from end of starting segment
    end = null; // in same sector, mating wall
	end_at_end = false;   // wall_at_end links from end of ending segment
	#from = new Vector();
	#to = new Vector();

	set(opts ) {
		if( opts.mating ) {
			if( opts.mating.into ) {
				throw new Error( "Wall is alreadying mating another wall" );
			}
			this.into = opts.mating;
			opts.mating.into = this;
			this.line = this.into.line;
			this.#sector = this.into.#sector;
			return;			
		}
		//opts.world.addWall( this );	

		this.line = this.parent.getLine( { ray:opts.using } );	
		if( opts.start ) {
			if( opts.start.#sector )
				this.#sector = opts.start.#sector;
			if( opts.startAtEnd ) {
				ASSERT( opts.start.end === null )
				opts.start.end = this;
				opts.start.end_at_end = false;
			} else {
				ASSERT( opts.start.start === null )
				opts.start.start = this;
				opts.start.start_at_end = false;
			}
			this.start = opts.start;
			this.start_at_end = opts.startAtEnd;
			//console.log( "Do intersect line 1 start side.." );
			this.#from = this.line.ptFrom;
			this.#to = this.line.ptTo;
			this.line.intersect( false, this.start.line, opts.startAtEnd );
			//console.log( "Intersected lines:", this.line, this.start.line );
		}

		if( opts.end ) {
			if( opts.start.#sector )
				this.#sector = opts.start.#sector;
			if( opts.endAtEnd ) {
				ASSERT( opts.end.end === null )
				opts.end.end = this;
				opts.end.end_at_end = true;
			} else{
				ASSERT( opts.end.start === null )
				opts.end.start = this;
				opts.end.start_at_end = true;
			}
			this.end = opts.end;
			this.end_at_end = opts.endAtEnd;
			this.line.intersect( true, this.end.line,  opts.endAtEnd);
			console.log( "Intersected lines:", this.line, this.end.line );
		}else console.log( "Skipping second mating line" );

	}
	constructor( set, opts ) {
		super( set );
		if( opts ) this.set(opts);
	}

	update() {
		if( this.#flags.dirty ) {
			this.#from = this.line.ptFrom;
			this.#to = this.line.ptTo;
			this.#flags.dirty = false;
		}
	}
	next( fromEnd ) {		
		if( fromEnd[0] ) {
			const e = this.end;
			fromEnd[0] = ( e.start === this ); 
			return e;
		}
		const e = this.start;
		fromEnd[0] = (e.start === this);
		return this.start;	
	}
	get from() {
		if( this.#flags.dirty ) this.update();
		return this.line.ptFrom;
	}
	get dirty() {
		return this.#flags.dirty;
	}
	set dirty(val) {
		this.#flags.dirty = true;
	}
	get to() {
		if( this.#flags.dirty ) this.update();
		return this.line.ptTo;
	}
	set sector(val) {
		this.#sector = val;
	}
	weld( wall ) {
		if( !this.into && !wall.into ) {
			this.into = wall.into;
			wall.into = this.into;
		}else {
			throw new Error( "One of the walls is already linked" );
		}
	}
	countWalls() {
		let pCur = this;
		let priorend = [true];
		let r = 0;
		do
		{
			r++;
			pCur = pCur.next(priorend)
		}while( pCur != this );
		return r;
	}
	updateMating( walls, bLockSlope, bErrorOK ){
		//PWORLD world = GetSetMember( WORLD, &g.worlds, iWorld );
		const result = {
			status : true
		};
		
		const pWall = this;
		function UpdateResult(r) {				 
			if( !r ) console.log( "Failing update at : updateResult updateMatin" ); 
			//console.log( "posting update for wall...", wall );
			if( r )
				if( !walls.find( w=>w===wall )) walls.push( wall );
			
			wall.#flags.bUpdating = false;  
			result.status = result.status && r;
			return result; 
		}
		
		var pls = this.line;
		var AdjustPass = 0;
		let pStart, pEnd;
		let ptStart, ptEnd;
		let lsStartSave, lsEndSave;
		let ptOther = new Vector();
		let ptOther2 = new Vector();
		bErrorOK = true; // DUH! 

		// this wall moved, so for all mating lines, update this beast.
		if( this.#flags.bUpdating )
			return true; // this is okay - we're just looping backwards.
	
		this.#flags.bUpdating = true;
		_debug_mating_update && console.log( "updateMating(1)", this.line.id, this.line );
		//Log( "updateMating("STRSYM(__LINE__)")" );
	
		if( this.countWalls( ) < 4 )
		{
			// with a triangular configuration it looks like peers intersect
			bErrorOK = true;
		}
	
		//Log( "updateMating("STRSYM(__LINE__)")" );
		const wall = this;
		if( !bLockSlope )
		{
			let plsStart, plsEnd;
			let redo = true;
			while(redo){
				redo = false;
				ptStart = wall.line.ptFrom;
				if( isNaN( ptStart.x ) ){
					console.trace( "Wall from is already bad.", ptStart, wall.line );
				}
				ptEnd = wall.line.ptTo;
			//Readjust:   
				pStart = wall.start;
				pEnd = wall.end;
				plsStart = pStart.line;
				plsEnd = pEnd.line;
				_debug_mating_update && console.log( "walls start:", plsStart.id, plsStart, plsEnd.id, plsEnd )
				lsStartSave = new Line( { line:pStart.line} );
				lsEndSave = new Line( {line:pEnd.line} );
				// check opposite any other walls other than those 
				// directly related for.. intersection with this line
				// which I intended to move.
				if( !bErrorOK )
				{
					let pCur = pWall;
					let plsCur;
					let priorend = [true];
					let r;
					do
					{
						plsCur =  pCur.line;
						if( pCur != pStart &&
							pCur != pWall &&
							pCur != pEnd )
						{
							if( r = FindIntersectionTime(  pls.r.n, pls.r.o
								, plsCur.r.n, plsCur.r.o ) )
							{
								if( r.t1 >= pls.from && r.t1 <= pls.to &&
									r.t2 >= plsCur.from && r.t2 <= plsCur.to )
									return UpdateResult( false );
							}
						}
						pCur = pCur.next(priorend)
					}while( pCur != pWall );
				}
		
				_debug_mating_update && console.log( "updateMating(2)", plsStart.ptFrom, new Error().stack.split('\n')[1].trim()  );
				if( pWall.start_at_end )
				{
					//console.log( "111111111111111111111111111111111111" );
					// compute start point..
					if( !pStart.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther.set(  pWall.start.to );
						// if original end != new end 
						if( !Near( ptOther, ptStart ) ) 
						{

							ptOther.set(  pWall.start.from );

							plsStart.from = -0.5;
							plsStart.to = 0.5;

							plsStart.r.o.set( ptOther2.add( ptStart, ptOther ).scale( 0.5 ) );
							plsStart.r.n.set( ptOther.sub( ptStart, ptOther ) );
							
							if( !ptOther.x && !ptOther.y && !ptOther.z ) debugger;
							//DrawLineSeg( plsStart, Color( 0, 0, 255 ) );
							walls.push( pStart );
							if( pStart.into )
							{
								pStart.#flags.bUpdating = true;
								if( !pStart.into.updateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pStart.#flags.bUpdating = false;
									plsStart.set( lsStartSave );
									return UpdateResult( false );
								}
								pStart.#flags.bUpdating = false;
							}
						}
					}
				}
				else  // ( !pWall.start_at_end )
				{
					//console.log( "22222222222222222222222222222222222222222" );
					// compute end point..
					if( !pStart.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther.set(  wall.start.from );
						// if original end != new end 
						_debug_mating_update && console.log( "HERE:", plsStart, ptOther, ptStart )
						if( !Near( ptOther, ptStart ) )
						{
							ptOther.set(  pWall.start.to );

							plsStart.from = -0.5;
							plsStart.to = 0.5;
							ptOther2.add( ptOther, ptStart ).scale( 0.5 );

							plsStart.r.o.set( ptOther2 )
							//SetPoint( plsStart.r.o, ptOther );
							ptOther.sub( ptOther, ptStart )

							plsStart.r.n.set( ptOther );


							//DrawLineSeg( plsStart, Color( 0, 0, 255 ) );
							walls.push( pStart );
							if( pStart.into )
							{
								pStart.#flags.bUpdating = true;
								if( !pStart.into.updateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pStart.flags.bUpdating = false;
									plsStart.set( lsStartSave );
									return UpdateResult( false );
								}
								pStart.#flags.bUpdating = false;
							}
						}
						else
						{
							//Log( "Points were the same?!" );
						}
					}
				}
				//Log( "updateMating("STRSYM(__LINE__)")" );
				if( pWall.end_at_end )
				{
					//console.log( "333333333333333333333333333333333" );
					if( !pEnd.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther.set(  pWall.end.to );
						// if original end != new end 
						if( !Near( ptOther, ptEnd ) )
						{

							ptOther.set( pWall.end.from );

							plsEnd.from = -0.5;
							plsEnd.to = 0.5;

							ptOther2.add( ptOther, ptEnd ).scale( 0.5 );

							plsEnd.r.o.set( ptOther2 )
							ptOther.sub( ptEnd, ptOther );
							if( !ptOther.x && !ptOther.y && !ptOther.z ) debugger;
							_debug_mating_update && console.log( "So this should have a NaN?", ptOther );
							plsEnd.r.n.set( ptOther );
							//DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );
							walls.push( pEnd );
							if( pEnd.into )
							{
								pEnd.#flags.bUpdating = true;
								if( !pEnd.into.updateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pEnd.#flags.bUpdating = false;
									plsStart.set( lsStartSave );
									plsEnd.set( lsEndSave );
									return UpdateResult( false );
								}   
		
								pEnd.#flags.bUpdating = false;
							}
						}
					}
				}
				else	//(!pWall.end_at_end)
				{
					// compute end point
					//console.log( "44444444444444444444444444444444" );
					if( !pEnd.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther.set(  pWall.end.from );

						// if original end != new end 
						if( !Near( ptOther, ptEnd ) )
						{
							// so end is opposite
							ptOther.set( pWall.end.to );
							
							plsEnd.from = -0.5;
							plsEnd.to = 0.5;

							plsEnd.r.o.set( ptOther2.add( ptOther, ptEnd ).scale( 0.5 ) )

							ptOther.sub( ptOther, ptEnd );
							if( !ptOther.x && !ptOther.y && !ptOther.z ) debugger;
							plsEnd.r.n.set( ptOther );
							

							//DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );
							walls.push( pEnd );
							if( pEnd.into )
							{
								pEnd.#flags.bUpdating = true;
								if( !pEnd.into.updateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pEnd.#flags.bUpdating = false;
									plsStart.set( lsStartSave );
									plsEnd.set( lsEndSave );
									return UpdateResult( false );
								}
								pEnd.#flags.bUpdating = false;
							}
						}
					}
				}
				// check to see if we crossed the mating lines..
				// if so - uncross them.
				//Log( "updateMating("STRSYM(__LINE__)")" );
				if( !bErrorOK )
				{
					let r;
					if( r = FindIntersectionTime( plsStart.r.n, plsStart.r.o
						, plsEnd.r.n, plsEnd.r.o ) &&
						r.t1 >= plsStart.from && r.t1 <= plsStart.to && 
						r.t2 >= plsEnd.from && r.t2 <= plsEnd.to  )
					{
						let tmp;
						if( AdjustPass++ )
						{
							console.log( "We're dying!" );
							return UpdateResult( false );
						}
						tmp = pWall.start_at_end;
						pWall.start_at_end = pWall.end_at_end;
						pWall.end_at_end = tmp;
		
						{
							let i = pWall.end;
							pWall.end = pWall.start;
							pWall.start = i;
						}
		
						if( pEnd.start == wall )
							pEnd.start_at_end = !pEnd.start_at_end;
						else
							pEnd.end_at_end = !pEnd.end_at_end;
		
						if( pStart.start == wall )
							pStart.start_at_end = !pStart.start_at_end;
						else
							pStart.end_at_end = !pStart.end_at_end;
						redo = true;
						continue;
						//goto Readjust;
					}


					// need to find some way to limit.. what happens when
					// lines become concave.. how do I detect that simply?
					//
					if( r = FindIntersectionTime( plsStart.r.n, plsStart.r.o
						, plsEnd.r.n, plsEnd.r.o ) &&
						( ( r.t2 >= plsEnd.from && r.t2 <= plsEnd.to ) || 
						( r.t1 >= plsStart.from && r.t1 <= plsStart.to ) )  )
					{
						// if either segment intersects the other during itself..
						// then this is an invalid update.. 
						plsStart.set( lsStartSave );
						plsEnd.set( lsEndSave );
						return UpdateResult( false );
					}
					// this is still insufficient.. and should continue to check
					// remaining segments..
				}
				//Log( "updateMating("STRSYM(__LINE__)")" );

				this.#sector.dirty = true;
				//ComputeSectorPointList( iWorld, pWall.iSector, NULL );
				//ComputeSectorOrigin( iWorld, pWall.iSector );
				
				//MarkSectorUpdated( iWorld, pWall.iSector );
			}
		}
		else
		{
			let plsStart, plsEnd;
			// handle updates but keep constant slope on mating lines..
			// check intersect of current with every other line in the
			// sector - prevents intersection of adjoining
			pStart = pWall.start;
			pEnd =  pWall.end ;
			plsStart = pStart.line;
			plsEnd = pEnd.line;
			{
				let pCur = pWall;
				let plsCur;
				let priorend = [true];
				let r;
				do
				{
					plsCur = pCur.line;
					if( pCur != pStart &&
						pCur != pWall &&
						pCur != pEnd )
					{
						if( r = FindIntersectionTime( pls.r.n, pls.r.o
							, plsCur.r.n, plsCur.r.o ) )
						{
							if( r.t1 >= pls.from && r.t1 <= pls.to &&
								r.t2 >= plsCur.from && r.t2 <= plsCur.to )
								return UpdateResult( false );
						}
					}
					pCur = pCur.next(priorend);
				}while( pCur != pWall );
			}
	
			{
				let r;
				// sigh - moved line.. update end factors
				// of intersecting lines..
				if( r = FindIntersectionTime( pls.r.n, pls.r.o
					, plsStart.r.n, plsStart.r.o ) )
				{
					pls.from = r.t1;
					if( pWall.start_at_end )
						plsStart.to = r.t2;
					else
						plsStart.from = r.t2;
					pWall.start.updateMating( walls, false, true );
				}
				else
				{
					console.log( "Failed to intersect wall with iWallStart %s(%d)", "classes.mjs",0);
					return UpdateResult( false );
				}
	
				if( r = FindIntersectionTime( pls.r.n, pls.r.o
					, plsEnd.r.n, plsEnd.r.o ) )
				{
					pls.to = r.t1;
					if( pWall.end_at_end )
						plsEnd.to = r.t2;
					else
						plsEnd.from = r.t2;
					pWall.end.updateMating( walls, false, true );
				}
				else
				{
					console.log( "Failed to intersect wall with iWallStart %s(%d)", "classes.mjs",0 );
					return UpdateResult( false );
				}
			}
		}
		if( pWall.into )
		{
			// only the orogiinal slopes can be locked..
			// the mating sector might have to move his wall slope.
			if( !pWall.into.updateMating( walls, false /*bLockSlope*/, bErrorOK ) )
				return UpdateResult( false );
		}
		// posts line update too.
		//ServerBalanceALine( iWorld, pWall.iLine );
		//ServerBalanceALine( iWorld, pStart.iLine );
		//ServerBalanceALine( iWorld, pEnd.iLine );
		pWall.#sector.dirty = true;
		return UpdateResult( true );
	
	}

	move( x, y, lock ) {
		this.line.r.o.x += x;
		this.line.r.o.y += y;
		const walls = [];		
		this.updateMating( walls, true, false );
		for( let wall of walls )
			wall.line.on("update", wall.line );
	}

	turn( x, y, lock ) {
		this.line.r.n.x += x;
		this.line.r.n.y += y;
		const walls = [];		
		this.updateMating( walls, true, false );
		this.line.on("update", this.line );
		for( let wall of walls )
			wall.line.on("update", wall.line );

	}

	setStart(x,y, lock){
		const startWas = this.from;
		const endWas = this.to;

		const newX = startWas.x + x;
		const newY = startWas.y + y;
		const newZ = startWas.z + 0;

		this.line.r.o.x = (newX + endWas.x)/2
		this.line.r.o.y = (newY + endWas.y)/2
		this.line.r.o.z = (newZ + endWas.z)/2
		this.line.from = -0.5;
		this.line.to = 0.5;
		this.line.r.n.x = endWas.x - newX;
		this.line.r.n.y = endWas.y - newY;
		this.line.r.n.z = endWas.z - newZ;

		const walls = [];		
		if( this.updateMating( walls, lock, false ) ) {
		//console.log( "Update list:", walls.length );
		for( let wall of walls ) {
			//console.log( "Sending wall ", wall.id );
			wall.line.on("update", wall.line );
		}
		}
		//console.log( "LINE RESULT after:", this.line.r, this.line );

	}
	setEnd(x,y, lock){
		const startWas = this.from;
		const endWas = this.to;

		const newX = endWas.x + x;
		const newY = endWas.y + y;
		const newZ = endWas.z + 0;

		this.line.r.o.x = (startWas.x + newX)/2
		this.line.r.o.y = (startWas.y + newY)/2
		this.line.r.o.z = (startWas.z + newZ)/2
		this.line.from = -0.5;
		this.line.to = 0.5;
		this.line.r.n.x = newX - startWas.x;
		this.line.r.n.y = newY - startWas.y;
		this.line.r.n.z = newZ - startWas.z;

		const walls = [];		
		if( this.updateMating( walls, lock, false ) ){
		//console.log( "Update list2:", walls.length );
		for( let wall of walls )
			wall.line.on("update", wall.line );
		}

	}

	
}


//--------------------------------------------

class SectorSet extends Pool {
	constructor(parent) {
		super( parent, Sector );
	}
}

class SectorMsg {
	sector = localParseState.world.getSector();
}

function buildSectorfromJSOX( field,val ) {
	try {
	if( !field ) {
		this.sector.dirty = true;
		return this.sector;
	} else {
		if( field === "id" ) { this.sector.id = val; return undefined; }
		if( field === "name" ) { this.sector.name = val; return undefined; }
		if( field === 'r' ) return this.sector.r = val; // have to replace this.
		if( field === "texture" ) { this.sector.texture = val; return undefined; }
		if( field === "wall" ) { this.sector.wall = val; return undefined; }
		//if( field === "flags" ) { return this.sector.flags; }
		
		console.log( "GET:", field );
		return val;
	}
	}catch(err) {
		console.log( "Failure in sector reviver:", err );
	}
}

class Sector extends PoolMember{
	#flags = {
		bBody : false,
	 	bStaticBody : false,
		bOpenShape : false, // should be drawn with lines not filled polygons (line/curve)
		dirty : false,
	};
	name = null;
	wall = null;
	r = new Ray();
	texture = null;
   	#world = null;

	// processed point list..
	#pointlist = [];
	   #facet = null;
	   #set = null;

	set(opts ) {
		if( "id" in opts ) {
			this.r.set( opts.r );
			if( this.name === null ) this.name = null;
			else this.name = this.parent.names[this.name];
			this.#flags.dirty = true;
			return;
		}
		if( "undefined" !== typeof opts.normal ) {
			this.r.n.x = opts.normal.x;
			this.r.n.y = opts.normal.y;
			this.r.n.z = opts.normal.z;
		}
		if( !opts.firstWall ) throw new Error( "Sector initialization requires a wall.");
		( this.wall = opts.firstWall ).sector = this;
	}
	constructor( set, opts  ) {
		super( set );
		{
			this.#set = set;
			if( opts ) {
				this.set( opts ); // set set set and #set - great naming scheme.
				if( "undefined" !== typeof opts.x ) {
					this.r.o.x = opts.x;
					this.r.o.y = opts.y;
				}
			}
		}
	}
	has( wall ) {
		const start = this.wall;
		let test = start;
		let fromEnd = [true];
		do {
			if( wall === test ) return true;
			test = test.next(fromEnd);
		}while( test !== start );
	}
	set dirty(val) {
		this.#flags.dirty = true;
		this.on( "smudge" );
	}
	toJSOX() {
		// right now only the ogrigin changes
		// but we don't want to send everything chagnes all the time?		
		return JSOX.stringify( {id:this.id
			, r:this.r
			, t:this.texture&&this.texture.id
			, n:this.name&&this.name.id
			, w:this.wall&&this.wall.id
		} );
	}
	checkWalls() {
		const _debug = false;
		const start = this.wall;
		let check = this.wall;
		const priorEnd = [false];
		do {
			const p1 = check.line.ptFrom;
			const p2 = check.line.ptTo;
			let e1, e2;
			if( check.start_at_end ) {
				_debug && console.log( "using end of start" );
				e1 = check.start.line.ptTo;
			}else {
				_debug && console.log( "using start of start" );
				e1 = check.start.line.ptFrom;
			}
			if( check.end_at_end ) {
				_debug && console.log( "using end of end" );
				e2 = check.end.line.ptTo;
			}else{
				_debug && console.log( "using start of end" );
				e2 = check.end.line.ptFrom;
			}
			_debug && console.log( "Wall:", check.line.ptFrom, check.line.ptTo );
			_debug && console.log( "Start:", check.start.line.ptFrom, check.start.line.ptTo );
			_debug && console.log( "End:", check.end.line.ptFrom, check.end.line.ptTo );
			_debug && console.log( "First check", check, p1, p2, e1, e2 );

			if( !Near( p1, e1 ) ) throw new Error( "wall start is not mated correctly:"+ check.id + ";"+  check 
					 + '\nP1:' + (p1)
					 + '\nE1:' + (e1)
                + "\nOther:" + check.end.id
				);
			if( !Near( p2, e2 ) ) throw new Error( "wall end is not mated correctly:"+ check.id + ";"+ ( check ) 
					 + '\nP2:' + (p2)
					 + '\nE2:' + (e2)
                + "\nOther:" + check.end.id
				);
			check = check.next(priorEnd);
		} while( check != start );
	}
	#ComputePointList() {
		const temp = new Vector();
		let plsCur;
		let npoints = 0;
		let pStart, pCur;
		let pt;
		let priorend = [true];

		pCur = pStart = this.wall;
		do
		{	
			plsCur = pCur.line;//
			if( priorend[0] )
				pt = plsCur.ptTo;
			else
				pt = plsCur.ptFrom;
			temp.sum( pt );
			npoints++;
			pCur = pCur.next( priorend );
		}while( pCur != pStart && pCur );

		temp.scale( 1.0 / npoints );
		this.r.o.set( temp );

	}
	get points() {
		if( this.#flags.dirty ) this.#ComputePointList()
		return this.#pointlist;
	}
	get origin() {
		if( this.#flags.dirty ) this.#ComputePointList()
		return this.r.o;
	}

	contains( p )
	{
		// this routine is perhaps a bit excessive - if one set of 
		// bounding lines is found ( break; ) we could probably return true
		let pStart, pCur;
		const norm = new Vector();
		let plsCur;
		let even = 0, odd = 0;
		let priorend = [true];
		const pSector = this;
		pCur = pStart = pSector.wall;
		//lprintf( "------ SECTOR %d --------------", n );
		if( NearValue( p, this.r.o ) )
		{
			//lprintf( ".." );
			return pSector;
		}
		norm.sub( p, this.r.o );
		do
		{
			plsCur = pCur.line;
			const r = FindIntersectionTime( norm, this.r.o
				, plsCur.r.n, plsCur.r.o );
			if( r )
			{
			
				// if T1 < 1.0 or T1 > -1.0 then the intersection is not
				// beyond the end of this line..  which I guess if the origin is skewed
				// then one end or another may require success at more than the distance
				// from the origin to the line..
				//Log4( "Intersected at %g %g %g . %g", T1, T2,
				//	  plsCur.from, plsCur.to );
				if( ( r.t2 >= plsCur.from && r.t2 <= plsCur.to )
				   || ( r.t2 >= plsCur.to && r.t2 <= plsCur.from ) )
				{
					if( r.t1 > 1.0 )
						even = 1;
					else if( r.t1 < -1.0 ) // less than zero - that's the point of the sector origin..
						odd = 1;
					if( even && odd ) return true;
				}
			}
			pCur = pCur.next( priorend );
		}while( pCur !== pStart );
		return false;
	}

	findWall( n, o )
	{
		let pStart, pCur;
		let priorend = [true];

		pCur = pStart = this.wall;
		//Log( "------- FindIntersectingWall ------------ " );
		do
		{
			let plsCur = pCur.line;
			let r;
			if( r = FindIntersectionTime( n, o
				, plsCur.r.n, plsCur.r.o ) )
			{
				if( drawLine )
					drawLine(  n, o, 0.9, 1.1, 'rgb(255,0,0)')
				//console.log( "Intersects somewhere.. %d<%d<%d %d<%d<%d", 0.0
				//         , r.t1, 1.0, plsCur.from, r.t2, plsCur.to );
				if( (-1 <= r.t1) && (r.t1 <= 1) &&
					(((plsCur.from <= r.t2) && (r.t2 <= plsCur.to)) ) )
				{
				return pCur;
				}
			}
			pCur = pCur.next( priorend );
		}while( pCur != pStart );
		return null;
	}
	
	move(x,y, lock) {
		const pStart = this.wall;
		let pCur = pStart;
		let priorend = [true];
		do {
			const o = pCur.line.r.o;
			//console.log( "Moving sector's line:", x, y );
			o.x += x
			o.y += y;
			pCur = pCur.next( priorend );
		}while( pCur != pStart );
		const walls = [];
		do {
			pCur.updateMating( walls, lock, false )
			pCur = pCur.next( priorend );
		}while( pCur != pStart );
		//console.log( "Resulting move moved", walls.length, "walls" );
		for( let wall of walls ) {
			//console.log( "update wall...", wall );
			wall.line.on( 'update' );
			//wall.set.on( 'update', wall );
		}
		this.on( 'update' );
		return walls;
	}

}

//--------------------------------------------

/*
typedef struct body_tag {
   // list of methods which are called when body is stepped in time.
	PLIST peripheral_tick;
	PTRANSFORM motion; // my current inertial frame;
   INDEX iSector; // sector in world which is me.
} FLATLANDER_BODY, *PFLATLANDER_BODY;
*/

//--------------------------------------------

const undoOperations = {
		create : {
			sector : 0,
			wall : 0,
			label : 0,
		},
		delete : {
			sector : 0,
			wall : 0,
			label : 0,
		},
		set : {
			sector : 0,
			wall : 0,
			label : 0,
		}
		
	};
function setEnum() {
	let n = 1;
	const k1 = Object.keys( undoOperations );
	for( let k of k1 ) {
		const here = undoOperations[k];
		const k2 = Object.keys( here );
		for( let k of k2 ) {
			here[k] = n++;
		}
	}
}
setEnum();

class UndoRecord
{
	type = 0; // from enum

        data = null;  // depends on type
/*        
	union {
		struct {
			char byte;
		} nothing;
		struct {
			INDEX pWall;
			FLATLAND_MYLINESEG original;
		} end_start;
		struct {
			let nwalls;
			INDEX *walls;
			FLATLAND_MYLINESEG *lines;
		} wallset;
		struct {
			let nsectors;
			INDEX *sectors;
			let origin;
			let bCompleted;
			let endorigin;
		} sectorset;
	} data;
*/        
	next = null;
}

/*
struct flagset
{
		uint32_t num;
		uint32_t *flags;
};

struct all_flagset
{
	struct flagset lines;
	struct flagset walls;
	struct flagset sectors;
	struct flagset names;
	struct flagset textures;
	FLAGSET( deleteset, 5 ); // count of sets to delete entirely.
};
*/

class World {
	#lines = new LineSet( this );
	get lineSet() { return this.#lines }
	get lines() { return this.#lines.array }
	#walls = new WallSet( this );
	get wallSet() { return this.#walls }
	get walls() { return this.#walls.array }
	#sectors = new SectorSet( this );
	get sectorSet() { return this.#sectors }
	get sectors() { return this.#sectors.array }
	#names = new NameSet( this );
	get nameSet() { return this.#names }
	get names() { return this.#names.array }
	#textures= new TextureSet(this);
	get textureSet() { return this.#textures }
	get textures() { return this.#textures.array }

	bodies = [];
	#firstUndo = null;
	#firstRedo = null;
	name = null;

	#events = {};
	

	constructor( msg ) {
        	if( msg instanceof WorldMsg ) {
                	//this.#lines = msg.lines;
                	//this.#walls = msg.walls;
                	//this.#sectors = msg.sectors;
                	//this.#names = msg.names
                        this.name = msg.name;
                	return;
                }
	}


	createSector( wall, x, y ) {
		const w = this.getWall( { mating:wall } );

		const sector = this.getSector( { firstWall:wall });
		
	}
	getLine( opts ){
		return this.#lines.get( opts );
	}
	getWall( opts ){
		return this.#walls.get( opts );
	}
	getTexture( opts ){
		return this.#textures.get( opts );
	}
	getSector( opts ){
		return this.#sectors.get( opts );
	}
	createSquareSector( x, y ) {
				
		const wall1 = this.getWall( { world:this, start:null, startAtEnd:false, end:null, endAtEnd:false
						, using:new Ray( new Vector( x-5,0 ), new Vector( 0, 1 ) )  
								} );

		const sector = this.getSector( { firstWall : wall1,
								 normal: new Vector(0,0,1 ) } );
		
		const wall2 =	this.getWall( { world:this, start:wall1, startAtEnd:true, end:null, endAtEnd:false
						, using:new Ray( new Vector( 0,y+5,0 ), new Vector( 1, 0 ) )
								} );
	
		const wall3 = this.getWall( { world:this, start:wall1, startAtEnd:false, end:null, endAtEnd:true
						, using:new Ray( new Vector( 0,y-5,0 ), new Vector( 1, 0 ) )
								} )

		this.getWall( { world:this, start:wall3, startAtEnd:true, end:wall2, endAtEnd:true
				, using:new Ray( new Vector( x+5,0 ), new Vector( 0, 1 ) )  
					} );
			

		sector.checkWalls();
		
		const texture = this.getTexture( this.getName( "Default" ) );
		if( !texture.flags.bColor )
			texture.SetSolidColor( AColor( 170, 170, 170, 0x80 ) );
		sector.texture = texture;
		//MarkSectorUpdated( iWorld, iSector );
							
	}

	getName(name ) {
		return this.#names.get({name:name})
	}

	getSectorAround( o ) {
		for( let sector of this.sectors ) {
			if( sector.contains( o ) ) return sector;
		}
	}


	moveSector( id, x, y, lock ){
		const sector = this.sectors[id];
		console.log( "move sector:", sector, id, x, y );
		const walls = sector.move( x, y, lock );
		//console.log( "TRIGGER UPDATE", walls, this.#events );
		if( walls.length )
			this.on( "update" );
	}

	on( event, data, data2 ) {
		if( "function" === typeof data ) {
			_debug_events && console.log( "REGSITERING EVENT IN");
			const newEvent = {cb:data,param:data2};
			if( event in this.#events )
				this.#events[event].push( newEvent );
			else
				this.#events[event] = [newEvent];
		}
		else{
			_debug_events && console.log( "USING EVENT IN", event );
			try {
			if( event in this.#events ) {
				this.#events[event].forEach( cb=>cb.cb.call(cb.param,data,data2) );
			}
			}catch(err) {
				console.log( "Callback event threw an error", err );
			}
		}
	}
	toJSOX(stringifier) {
		const msg = {
			names : this.#names.toObject(),
			sectors : this.#sectors.toObject(),
			walls : this.#walls.toObject(),
			lines : this.#lines.toObject()
		}
		//console.log( "PARAM:", stringifier );
		//console.log( "Stringifying mirror world" );
		return stringifier.stringify( msg );
	}
	
/*
	POBJECT object;

	PDATAQUEUE UpdatedLines;
	CRITICALSECTION csDeletions;
	struct all_flagset deletions;
*/
}

const tmp = null;
/** @nocollapse */
World.fromJSOX = function( field,val ) {
	if( !field ) {
		if( this instanceof WorldMsg ){
			console.log( "Create new world from world message");
                        return new World( this );
		}
	}else {        	
		this[field] = val;
		return undefined;
	}
}
/** @nocollapse */
World.toJSOX = function(stringifier) {
	return this.toJSOX(stringifier);
}

class WorldMsg {
	world = new World();
	names = null;
	sectors = null;
	walls = null;
	lines = null;	
	constructor() {
		localParseState.world = this.world;
	}
}

function buildWorldfromJSOX( field, val ) {
	//console.log( "FIELD:", field );
	if( !field ) {
		return this.world;
	}
	return val;//this.world[field]  /// element allocation comes directly from the correct arrays anyway.
}

/*
World.revive = function(field,val) {
	if( field ) {
		return val;
	}else {
		return this;
	}
}
*/	



const classes = {
	World:World,
	Sector:Sector,
	Wall:Wall,
	Line:Line,
	Name:Name,
	Texture:Texture,
	UndoRecord:UndoRecord,

	setDecoders(jsox) {
		jsox.fromJSOX( "~Wr", WorldMsg, buildWorldfromJSOX );
		jsox.fromJSOX( "~S", SectorMsg, buildSectorfromJSOX );
		jsox.fromJSOX( "~Wl", WallMsg, buildWallfromJSOX );
		jsox.fromJSOX( "~L", LineMsg, buildLinefromJSOX );
		jsox.fromJSOX( "~N", NameMsg, buildNamefromJSOX );
		jsox.fromJSOX( "~T", TextureMsg, buildTexturefromJSOX );
		jsox.fromJSOX( "v3", Vector );
		jsox.fromJSOX( "r", Ray );
	},
	setEncoders(jsox) {
		jsox.toJSOX( "~Wr", World, World.toJSOX );
		jsox.toJSOX( "~S", Sector/*, sectorToJSOX*/ );
		jsox.toJSOX( "~Wl", Wall, wallToJSOX );
		jsox.toJSOX( "~L", Line );
		jsox.toJSOX( "~N", Name );
		jsox.toJSOX( "~T", Texture );
		jsox.toJSOX( "v3", Vector );
		jsox.toJSOX( "r", Ray );
	},
	setDrawLine(d) {
		drawLine = d;
	}
}


export {classes, World,Sector,Wall,Line,Name,Texture,UndoRecord,Vector}
