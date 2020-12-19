
let drawLine = null;
import {JSOX} from "./jsox.mjs"

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
		if( "object" === typeof id ) {
			opts = id;
			id = null;
		}else {
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
			}else {
				if( opts ) 
					r.set( opts );
			}
			return r;
		}
		if( this.#free.length ){
			const r = this.#free.pop();
			r.set( opts );
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

	drop( w ) {
		this.#free.push(w);
		this.#used[w.id] = null;
		this.parent.on("destroy", w );
	}

	on( event, data, data2 ) {
		if( "function" === typeof data ) {
			console.log( "REGSITERING EVENT IN");
			const newEvent = {cb:data,param:data2};
			if( event in this.#events )
				this.#events[event].push( newEvent );
			else
				this.#events[event] = [newEvent];
		}
		else{
			console.log( "USING EVENT IN");
			
			if( event in this.#events ) {
				let result = null;
				this.#events[event].forEach( cb=>{ 
					const zz = cb.cb.call(cb.param,data,data2);
					if( result ) result = [result].push(zz);
					else result = zz;
				} );
				console.log( "on event result:", result );
				return result;
			}
		}
	}
}

class NameSet extends Pool {

	constructor(parent) {
		super( parent, Name );
	}

}

class NameMsg{
}
class Name {
	static #autoid = 1;
	flags = { vertical : false };
	name = '';
	#set = null;
	// craete/allocate
	constructor(set, opts) {
		this.#set = set;
		name = opts.name || ("Name " + Name.#autoid++);
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

}
class Texture {
	flags = { color : true };
	color = null;
	name = null;
	set = null;

	constructor(set) {
		this.set = set;
	}
	set(v) {
		this.name = v;
	}
	get() {
		return this.name;
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
	set(v) { this.x = v.x; this.y = v.y;this.z = v.z; return this;}
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
	r = null;
	f = 0;
	t = 0;
}

class Line {
	r = new Ray();
	from = -Infinity;
	#pFrom = new Vector();
	to = Infinity;
	#pTo = new Vector();
	#flags = { 
		updated : false
	}
	#set = null;
	
	constructor( set, opts ) {

		this.#set = set;
		this.set(opts)
	}
	toJSOX() {
		return JSOX.stringify( {r:this.r, t:this.to,f:this.from});
	}
	set( opts ) {
		if( opts.line && opts.line instanceof Line ){
			this.r.o.set( opts.ray.r.o );
			this.r.n.set( opts.ray.r.n );
			this.from = opts.ray.from;
			this.to = opts.ray.to;
			return;
		}
		this.r = opts.ray;
		if( "number" === typeof opts.from ) {
			this.from = opts.from;
			this.to = opts.to;
		}
		this.#flags.updated = true;
		this.#set.on( "update", this );
	}

	get ptFrom() {
		return this.#pFrom.addScaled( this.r.o, this.r.n, this.from );
	}
	get ptTo() {
		return this.#pTo.addScaled( this.r.o, this.r.n, this.to );
	}
	setFromm(l){
		this.r.o.set( l.r.o );
		this.r.n.set( l.r.n );
		this.from = l.from;
		this.to = l.to;
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

}
class Wall {
	#flags = {
		bUpdating : false, // set this while updating to prevent recursion..
	   	detached : false, // joined by joined FAR
		   bSkipMate: false, // used when updating sets of lines - avoid double update mating walls
		   dirty : true,
	};
	id = -1;
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
	#set = null;

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

		this.line = this.#set.parent.getLine( { ray:opts.using } );	
		if( opts.start ) {
			if( opts.start.#sector )
				this.#sector = opts.start.#sector;
			if( opts.startAtEnd ) {
				ASSERT( opts.start.end === null )
				opts.start.end = this;
			} else {
				ASSERT( opts.start.start === null )
				opts.start.start = this;
			}
			this.start = opts.start;
			this.start_at_end = opts.startAtEnd;
			//console.log( "Do intersect line 1 start side.." );
			this.line.intersect( false, this.start.line, opts.startAtEnd );
			//console.log( "Intersected lines:", this.line, this.start.line );
		}

		if( opts.end ) {
			if( opts.start.#sector )
				this.#sector = opts.start.#sector;
			if( opts.endAtEnd ) {
				ASSERT( opts.end.end === null )
				opts.end.end = this;
			} else{
				ASSERT( opts.end.start === null )
				opts.end.start = this;
			}
			this.end = opts.end;
			this.end_at_end = opts.endAtEnd;
			this.line.intersect( true, this.end.line,  opts.endAtEnd);
			console.log( "Intersected lines:", this.line, this.end.line );
		}else console.log( "Skipping second mating line" );

	}
	constructor( set, opts ) {
		this.#set = set;
		if( opts ) this.set(opts);
	}

	update() {
		if( this.#flags.dirty ) {
			this.#from.addScaled( this.line.r.o, this.line.r.n, this.line.from );
			this.#to.addScaled( this.line.r.o, this.line.r.n, this.line.to );
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
		return this.#from;
	}
	get dirty() {
		return this.#flags.dirty;
	}
	set dirty(val) {
		this.#flags.dirty = true;
	}
	get to() {
		if( this.#flags.dirty ) this.update();
		return this.#to;
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
			if( !r ) Log1( "Failing update at : %d", __LINE__ ); 
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
		bErrorOK = true; // DUH! 

		// this wall moved, so for all mating lines, update this beast.
		if( this.#flags.bUpdating )
			return true; // this is okay - we're just looping backwards.
	
		this.#flags.bUpdating = true;
		console.log( "UpdateMating(1)" );
		//Log( "UpdateMating("STRSYM(__LINE__)")" );
	
		if( this.countWalls( ) < 4 )
		{
			// with a triangular configuration it looks like peers intersect
			bErrorOK = true;
		}
	
		//Log( "UpdateMating("STRSYM(__LINE__)")" );
		const wall = this;
		if( !bLockSlope )
		{
			let plsStart, plsEnd;
			let redo = true;
			while(redo){
				redo = false;
				ptStart = wall.line.ptFrom;
				ptEnd = wall.line.ptTo;
			//Readjust:   
				pStart = wall.start;
				pEnd = wall.end;
				plsStart = pStart.line;
				plsEnd = pEnd.line;
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
		
				//Log( "UpdateMating("STRSYM(__LINE__)")" );
				if( pWall.start_at_end )
				{
					let ptOther;
					// compute start point..
					if( !pStart.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther = plsStart.ptTo;
						// if original end != new end 
						if( !Near( ptOther, ptStart ) ) 
						{
							let pOtherWall = pStart.start;
							let plsOther = pOtherWall.line;
							/*
							Log7( "Line Different %d: <%g,%g,%g> <%g,%g,%g> "
							, __LINE__
							, ptOther[0]
							, ptOther[1]
							, ptOther[2]
							, ptStart[0]
							, ptStart[1]
							, ptStart[2] );
							Log7( "Line Different %d: <%08x,%08x,%08x> <%08x,%08x,%08x> "
							, __LINE__
							, RCOORDBITS(ptOther[0])
							, RCOORDBITS(ptOther[1])
							, RCOORDBITS(ptOther[2])
							, RCOORDBITS(ptStart[0])
							, RCOORDBITS(ptStart[1])
							, RCOORDBITS(ptStart[2]) );
							*/
							if( pStart.start_at_end )
								ptOther = plsOther.ptTo;
							else
								ptOther = plsOther.ptFrom;
		
							plsStart.from = 0;
							plsStart.to = 1;
							plsStart.r.o.set( ptOther );
							ptOther.sub( ptStart, ptOther );
							plsStart.r.n.set( ptOther );
							//DrawLineSeg( plsStart, Color( 0, 0, 255 ) );
							if( pStart.into )
							{
								pStart.#flags.bUpdating = true;
								if( !pStart.into.UpdateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pStart.#flags.bUpdating = false;
									plsStart.setFrom( lsStartSave );
									return UpdateResult( false );
								}
								pStart.#flags.bUpdating = false;
							}
						}
					}
				}
				else  // ( !pWall.start_at_end )
				{
					let ptOther;
					// compute end point..
					if( !pStart.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther = plsStart.ptFrom;
						// if original end != new end 
						console.log( "HERE:", plsStart, ptOther, ptStart )
						if( !Near( ptOther, ptStart ) )
						{
							let pOtherWall = pStart.end;
							let plsOther = pOtherWall.line;
							/*
							Log7( "Line Different %d: <%g,%g,%g> <%g,%g,%g> "
							, __LINE__
							, ptOther[0]
							, ptOther[1]
							, ptOther[2]
							, ptStart[0]
							, ptStart[1]
							, ptStart[2] );
							Log7( "Line Different %d: <%08x,%08x,%08x> <%08x,%08x,%08x> "
							, __LINE__
							, RCOORDBITS(ptOther[0])
							, RCOORDBITS(ptOther[1])
							, RCOORDBITS(ptOther[2])
							, RCOORDBITS(ptStart[0])
							, RCOORDBITS(ptStart[1])
							, RCOORDBITS(ptStart[2]) );
							*/
							if( pStart.end_at_end )
								ptOther = plsOther.to;
							else
								ptOther = plsOther.from;

							plsStart.from = -1;
							plsStart.to = 0;
							plsStart.r.o.set( ptOther )

							//SetPoint( plsStart.r.o, ptOther );
							ptOther.sub( ptOther, ptStart )
							plsStart.r.n.set( ptOther );
							//DrawLineSeg( plsStart, Color( 0, 0, 255 ) );
							if( pStart.into )
							{
								pStart.#flags.bUpdating = true;
								if( !pStart.into.UpdateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pStart.flags.bUpdating = false;
									plsStart.setFrom( lsStartSave );
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
				//Log( "UpdateMating("STRSYM(__LINE__)")" );
				if( pWall.end_at_end )
				{
					let ptOther;
					if( !pEnd.#flags.bUpdating )
					{
						// compute original end of this line
						ptOther = plsEnd.ptTo;
						// if original end != new end 
						if( !Near( ptOther, ptEnd ) )
						{
							let pOtherWall = pEnd.start;
							let plsOther = pOtherWall.line;
							/*
							Log7( "Line Different %d: <%g,%g,%g> <%g,%g,%g> "
							, __LINE__
							, ptOther[0]
							, ptOther[1]
							, ptOther[2]
							, ptEnd[0]
							, ptEnd[1]
							, ptEnd[2] );
							Log7( "Line Different %d: <%08x,%08x,%08x> <%08x,%08x,%08x> "
							, __LINE__
							, RCOORDBITS(ptOther[0])
							, RCOORDBITS(ptOther[1])
							, RCOORDBITS(ptOther[2])
							, RCOORDBITS(ptEnd[0])
							, RCOORDBITS(ptEnd[1])
							, RCOORDBITS(ptEnd[2]) );
							*/
							if( pEnd.start_at_end )
								ptOther = plsOther.ptTo;
							else
								ptOther = plsOther.ptFrom;
							plsEnd.from = 0;
							plsEnd.to = 1;
							lsEnd.r.o.set( ptOther );
							ptOther.sub( ptEnd, ptOther );
							plsEnd.r.n.set( ptOther );
							//DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );
							if( pEnd.into )
							{
								pEnd.#flags.bUpdating = true;
								if( !pEnd.into.UpdateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pEnd.#flags.bUpdating = false;
									plsStart.setFrom( lsStartSave );
									plsEnd.setFrom( lsEndSave );
									return UpdateResult( false );
								}   
		
								pEnd.#flags.bUpdating = false;
							}
						}
					}
				}
				else	//(!pWall.end_at_end)
				{
					let ptOther;
					// compute end point
					if( !pEnd.#flags.bUpdating )
					{
		
						// compute original end of this line
						ptOther = plsEnd.ptFrom;
						// if original end != new end 
						if( !Near( ptOther, ptEnd ) )
						{
							let pOtherWall =  pEnd.end;
							let plsOther = pOtherWall.line;
							/*
							Log7( "Line Different %d: <%g,%g,%g> <%g,%g,%g> "
							, __LINE__
							, ptOther[0]
							, ptOther[1]
							, ptOther[2]
							, ptEnd[0]
							, ptEnd[1]
							, ptEnd[2] );
							Log7( "Line Different %d: <%08x,%08x,%08x> <%08x,%08x,%08x> "
							, __LINE__
							, RCOORDBITS(ptOther[0])
							, RCOORDBITS(ptOther[1])
							, RCOORDBITS(ptOther[2])
							, RCOORDBITS(ptEnd[0])
							, RCOORDBITS(ptEnd[1])
							, RCOORDBITS(ptEnd[2]) );
							*/
							if( pEnd.end_at_end )
								ptOther = plsOther.ptTo;
							else
								ptOther = plsOther.ptFrom;
							plsEnd.from = -1;
							plsEnd.to = 0;
							plsEnd.r.o.set( ptOther );
							ptOther.sub( ptOther, ptEnd );
							plsEnd.r.n.set( ptOther );
							//DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );
							if( pEnd.into )
							{
								pEnd.#flags.bUpdating = true;
								if( !pEnd.into.UpdateMating( walls, false/*bLockSlope*/, bErrorOK ) )
								{
									pEnd.#flags.bUpdating = false;
									plsStart.setFrom( lsStartSave );
									plsEnd.setFrom( lsEndSave );
									return UpdateResult( false );
								}
								pEnd.#flags.bUpdating = false;
							}
						}
					}
				}
				// check to see if we crossed the mating lines..
				// if so - uncross them.
				//Log( "UpdateMating("STRSYM(__LINE__)")" );
				if( !bErrorOK )
				{
					let r;
					if( r = FindIntersectionTime( plsStart.r.n, plsStart.r.o
						, plsEnd.r.n, plsEnd.r.o ) &&
						t1 >= plsStart.from && t1 <= plsStart.to && 
						t2 >= plsEnd.from && t2 <= plsEnd.to  )
					{
						let tmp;
						if( AdjustPass++ )
						{
							Log( "We're dying!" );
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
		
						if( pEnd.iWallStart == iWall )
							pEnd.start_at_end = !pEnd.start_at_end;
						else
							pEnd.end_at_end = !pEnd.end_at_end;
		
						if( pStart.iWallStart == iWall )
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
						plsStart.setFrom( lsStartSave );
						plsEnd.setFrom( lsEndSave );
						return UpdateResult( false );
					}
					// this is still insufficient.. and should continue to check
					// remaining segments..
				}
				//Log( "UpdateMating("STRSYM(__LINE__)")" );

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
					pWall.start.UpdateMating( walls, false, true );
				}
				else
				{
					Log2( "Failed to intersect wall with iWallStart %s(%d)", __FILE__, __LINE__ );
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
					pWall.end.UpdateMating( walls, false, true );
				}
				else
				{
					Log2( "Failed to intersect wall with iWallStart %s(%d)", __FILE__, __LINE__ );
					return UpdateResult( false );
				}
			}
		}
		if( pWall.into )
		{
			// only the orogiinal slopes can be locked..
			// the mating sector might have to move his wall slope.
			if( !pWall.into.UpdateMating( walls, false /*bLockSlope*/, bErrorOK ) )
				return UpdateResult( false );
		}
		// posts line update too.
		//ServerBalanceALine( iWorld, pWall.iLine );
		//ServerBalanceALine( iWorld, pStart.iLine );
		//ServerBalanceALine( iWorld, pEnd.iLine );
		pWall.#sector.dirty = true;
		return UpdateResult( true );
	
	}

	
}


//--------------------------------------------

class SectorSet extends Pool {
	constructor(parent) {
		super( parent, Sector );
	}
	
}

class SectorMsg {
	id = null;
	wall = null;
	flags = null;
	texture = null;
	texture = null;

}

class Sector {
	#flags = {
		bBody : false,
	 	bStaticBody : false,
		bOpenShape : false, // should be drawn with lines not filled polygons (line/curve)
		dirty : false,
	};
	id = -1;
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
		if( "undefined" !== typeof opts.normal ) {
			this.r.n.x = opts.normal.x;
			this.r.n.y = opts.normal.y;
			this.r.n.z = opts.normal.z;
		}
		if( !opts.firstWall ) throw new Error( "Sector initialization requires a wall.");
		( this.wall = opts.firstWall ).sector = this;
	}
	constructor( set, opts  ) {
		this.#set = set;
		this.set(opts ); // set set set and #set - great naming scheme.
		if( "undefined" !== typeof opts.x ) {
			this.r.o.x = opts.x;
			this.r.o.y = opts.y;
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
		this.#set.on( "smudge", this );
	}
	#ComputePointList() {
		const temp = new Vector();
		const pt = new Vector();
		let plsCur;
		let npoints = 0;
		let pStart, pCur;
		let priorend = [true];

		pCur = pStart = this.wall;
		do
		{	
			plsCur = pCur.line;//
			if( priorend[0] )
				pt.addScaled( plsCur.r.o, plsCur.r.n, plsCur.to );
			else
				pt.addScaled( plsCur.r.o, plsCur.r.n, plsCur.from );
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
	
	move(x,y) {
		const pStart = this.wall;
		let pCur = pStart;
		let priorend = [true];
		do {
			const o = pCur.line.r.o;
			console.log( "Moving sector's line:", x, y );
			o.x += x
			o.y += y;
			pCur = pCur.next( priorend );
		}while( pCur != pStart );
		const walls = [];
		do {
			pCur.updateMating( walls, false, false )
			pCur = pCur.next( priorend );
		}while( pCur != pStart );
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
	#walls = new WallSet( this );
	#sectors = new SectorSet( this );
	#names = new NameSet( this );
    bodies = [];
    textures= [];
    #firstUndo = null;
    #firstRedo = null;
	name = null;
	#events = {};
	

	constructor() {
			//this.createSquareSector( 0, 0 );
			this.#lines.on("update", (line)=>{

			})
			this.#walls.on("update", (w)=>{
				
			})
			this.#sectors.on("update", (s)=>{
				
			})
	}


	getTexture( name ) {
		for( var t of this.textures ) {
			if( t.name === name ) return t;
		}
		const newT = new Texture();
		newT.name = name;
		this.textures.push( newT );
		return newT
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


	moveSector( id, x, y ){
		const sector = this.sectors[id];
		console.log(this.sectors, this, id, x, y );
		const walls = sector.move( x, y );
		console.log( "TRIGGER UPDATE", walls, this.#events );
		this.on( "update", JSOX.stringify({op:'move',walls:walls} ) );
	}

	on( event, data, data2 ) {
		if( "function" === typeof data ) {
			console.log( "REGSITERING EVENT IN");
			const newEvent = {cb:data,param:data2};
			if( event in this.#events )
				this.#events[event].push( newEvent );
			else
				this.#events[event] = [newEvent];
		}
		else{
			console.log( "USING EVENT IN");
			
			if( event in this.#events ) {
				this.#events[event].forEach( cb=>cb.cb.call(cb.param,data,data2) );
			}
		}
	}
	toJSOX() {
		const msg = {
			names : this.#names.toObject(),
			sectors : this.#names.toObject(),
			walls : this.#names.toObject(),
			lines : this.#names.toObject()
		}
	
		return JSOX.stringify( msg );
	}
	
/*
	POBJECT object;

	PDATAQUEUE UpdatedLines;
	CRITICALSECTION csDeletions;
	struct all_flagset deletions;
*/
}

const tmp = null;
World.fromJSOX = function( field,val ) {
	if( !field ) {
		if( this instanceof WorldMsg ){
			console.log( "Create new world from world message");
		}
	}else {
		tmp[field] = val;
		return undefined;
	}
}

World.toJSOX = function() {
	return this.toJSOX();
}

class WorldMsg {
	names = null;
	sectors = null;
	walls = null;
	lines = null;
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
		jsox.fromJSOX( "~Wr", WorldMsg, World.fromJSOX );
		jsox.fromJSOX( "~S", SectorMsg/*, Sector.fromJSOX*/ );
		jsox.fromJSOX( "~Wl", WallMsg );
		jsox.fromJSOX( "~L", LineMsg );
		jsox.fromJSOX( "~N", NameMsg );
		jsox.fromJSOX( "~T", TextureMsg );
		jsox.fromJSOX( "v3", Vector );
	},
	setEncoders(jsox) {
		jsox.toJSOX( "~Wr", World, World.toJSOX );
		jsox.toJSOX( "~S", Sector );
		jsox.toJSOX( "~Wl", Wall );
		jsox.toJSOX( "~L", Line );
		jsox.toJSOX( "~N", Name );
		jsox.toJSOX( "~T", Texture );
		jsox.toJSOX( "v3", Vector );
	},
	setDrawLine(d) {
		drawLine = d;
	}
}


export {classes, World,Sector,Wall,Line,Name,Texture,UndoRecord,Vector}
