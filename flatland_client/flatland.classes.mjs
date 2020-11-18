


class Name {
	flags = { vertical : false };
	name = [];
}

//--------------------------------------------

class Texture {
	flags = { color : true };
       	color = null;
		name = null;
		
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
function FindIntersectionTime(  s1,  o1, s2,  o2 )
{
	const result = {t1:0,t2:0};
	let R1 = new Vector(), R2 = new Vector(), denoms = new Vector();
	let t1, t2, denom;

	const a = (o1.x);
	const b = (o1.y)
	const c = (o1.z)

	const d = (o2.x)
	const e = (o2.y)
	const f = (o2.z)

	const na = (s1.x)
	const nb = (s1.y)
	const nc = (s1.z)

	const nd = (s2.x)
	const ne = (s2.y)
	const nf = (s2.z)

	console.log( "Inputs:", s1, s2 );
	if( ( !s1.x && !s1.y && !s1.z )||
       ( !s2.x && !s2.y && !s2.z ) )
	  return null;
	  
	  denoms.crossproduct( s1, s2 ); // - (negative) result...
	denom = denoms.z;
//   denom =  ( ne * na ) - ( nd * nb );
	if( NearValue( denom,0 ) )
	{
		denom = denoms.y;
//      denom = ( nd * nc ) - (nf * na );
		if( NearValue( denom,0 ) )
		{
			denom = denoms.x;
//         denom = ( nb * nf ) - ( ne * nc );
			if( NearValue( denom, 0 ) )
			{
            /*
//#ifdef FULL_DEBUG
				Log( "Bad!-------------------------------------------\n" );
//#endif
				Log6( "Line 1: <%g %g %g> <%g %g %g>"
							, s1.x, s1.y, s1.z 
							, o1.x, o1.y, o1.z );
				Log6( "Line 2:<%g %g %g> <%g %g %g>"
							, s2.x, s2.y, s2.z 
							, o2.x, o2.y, o2.z );
				*/
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
		// this one has been tested.......
		t1 = ( nd * ( b - e ) + ne * ( d - a ) ) / denom;
		t2 = ( na * ( b - e ) + nb * ( d - a ) ) / denom;
	}
	R1.addScaled( o1, s1, t1 );
	//R1.x = a + na * t1;
	//R1.y = b + nb * t1;
	//R1.z = c + nc * t1;
	R2.addScaled( o2, s2, t2 );
	//R2.x = d + nd * t2;
	//R2.y = e + ne * t2;
	//R2.z = f + nf * t2;

	result.t2 = t2;
	result.t1 = t1;
	{	
		let i;
		if( ( ((i=0),!NearValue(R1.x,R2.x) )) ||
			( ((i=1),!NearValue(R1.y,R2.y) )) ||
			( ((i=2),!NearValue(R1.z,R2.z) )) )
		{ 
			/*
			Log7( "Points (%12.12g,%12.12g,%12.12g) and (%12.12g,%12.12g,%12.12g) coord %d is too far apart"
			, R1.x, R1.y, R1.z
			, R2.x, R2.y, R2.z 
			, i );
			Log7( "Points (%08X,%08X,%08X) and (%08X,%08X,%08X) coord %d is too far apart"
			, *(int*)&R1.x, *(int*)&R1.y, *(int*)&R1.z
			, *(int*)&R2.x, *(int*)&R2.y, *(int*)&R2.z 
			, i );
			*/
			return null;
		}
	}
	return result;
}


class Line {
	r = new Ray();
	from = -Infinity;
    to = Infinity;
	#flags = { updated : false }
	constructor( ray, from, to ) {
		this.r = ray;
		if( "number" === typeof from ) {
			this.from = from;
			this.to = to;
		}
		this.#flags.updated = true;
	}

	intersect( bEnd1, pLine2, bEnd2 )
	{
		const pLine1 = this;
		// intersects line1 with line2
		// if bEnd1 then update pLine1.dTo else pLine1.dFrom
		// if bEnd2 then update pLine2.dTo else pLine2.dFrom
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
	return new Line( r, -Infinity, Infinity );
}

//--------------------------------------------

function ASSERT(e) {
	if( !e ) throw new Error( "Condition is false....");
}

class Wall {
	#flags = {
		bUpdating : false, // set this while updating to prevent recursion...
	   	detached : false, // joined by joined FAR
	   	bSkipMate: false, // used when updating sets of lines - avoid double update mating walls
	};
	id = -1;
    world = null;
    sector = null;
    name = null;
    line = null;
    into = null; // mate - to new sector

    start = null; // in same sector, mating wall
	start_at_end = false; // wall_at_start links from end of starting segment
    end = null; // in same sector, mating wall
	end_at_end = false;   // wall_at_end links from end of ending segment

	constructor( opts ) {
		if( opts ) {
			opts.world.addWall( this );	

			this.line = Line.makeOpenLine( opts.using );	
			if( opts.start ) {
				if( opts.startAtEnd ) {
					ASSERT( opts.start.end === null )
					opts.start.end = this;
				} else {
					ASSERT( opts.start.start === null )
					opts.start.start = this;
				}
				this.start = opts.start;
				this.start_at_end = opts.startAtEnd;
				console.log( "Do intersect line 1 start side..." );
				this.line.intersect( false, this.start.line, opts.startAtEnd );
				console.log( "Intersected lines:", this.line, this.start.line );
			}

			if( opts.end ) {
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
		console.log( "Created wall:", this );
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
		const pt = new Vector();
		return pt.addScaled( this.line.r.o, this.line.r.n, this.line.from );
	}
	get to() {
		const pt = new Vector();
		return pt.addScaled( this.line.r.o, this.line.r.n, this.line.to );
	}
	weld( wall ) {
		if( !this.into && !wall.into ) {
			this.into = wall.into;
			wall.into = this.into;
		}else {
			throw new Error( "One of the walls is already linked" );
		}
	}
}


//--------------------------------------------

class Sector {
	#flags = {
		bBody : false,
	 	bStaticBody : false,
		bOpenShape : false, // should be drawn with lines not filled polygons (line/curve)
	};
	id = -1;
	name = null;
	wall = null;
	r = new Ray();
	texture = null;
   	world = null;

	// processed point list...
	#pointlist = [];
   	#facet = null;

	constructor( w, x, y ) {
		if( w ) {
			this.world = w;
			w.addSector( this );
		}
		if( "undefined" !== typeof x ) {
			this.r.o.x = x;
			this.r.o.y = y;
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
	get points() {

		return this.#pointlist;
	}
	get origin() {
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
			return this.r.o;
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
			int nwalls;
			INDEX *walls;
			FLATLAND_MYLINESEG *lines;
		} wallset;
		struct {
			int nsectors;
			INDEX *sectors;
			_POINT origin;
			int bCompleted;
			_POINT endorigin;
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
	#freeLines = [];
	lines = [];
	#freeWalls = [];
   	walls = [];
	#freeSectors = [];
	sectors = [];
	names = [];
    bodies = [];
    textures= [];
    #firstUndo = null;
    #firstRedo = null;
	name = null;

	constructor() {
	        //this.createSquareSector( 0, 0 );
	}
	addWall(w) {
		
		return walls.push(w);

	}
	addWall(w) {
		if( w.id >= 0 ) throw new Error( "Already allocated" );
		if( this.#freeWalls.length ) {
				const spot = this.#freeWalls.pop();// pop is cheaper than shift()
				this.walls[spot] = w;
				w.id = spot;
		}
		w.id = this.walls.length; // ["walls",this.walls.length]
		this.walls.push(w);
	}
	delWall(w) {
		if( w.id < 0 ) throw new Error( "Already deleted" );
		const idx = walls.find( wall=>wall===w );
		if( idx >= 0 ) {
			this.#freeWalls.push(idx);
			w.id = -1;
		}
	}
	addSector(w) {
		if( w.id >= 0 ) throw new Error( "Already allocated" );
		if( this.#freeSectors.length ) {
				const spot = this.#freeSectors.pop();// pop is cheaper than shift()
				this.sectors[spot] = w;
				w.id = spot;
		}
		w.id = this.sectors.length;
		this.sectors.push(w);
	}
	delSector(w) {
		if( w.id < 0 ) throw new Error( "Already deleted" );
		const idx = sectors.find( sector=>sector===w );
		if( idx >= 0 ) {
			this.#freeSectors.push(idx);
			w.id = -1;
		}
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
	createSector( x, y ) {
		const sector = new Sector( this );
		
	}
	createSquareSector( x, y ) {
				
		const wall1 = new Wall( { world:this, start:null, startAtEnd:false, end:null, endAtEnd:false
						, using:new Ray( new Vector( x-0.5,0 ), new Vector( 0, 1 ) )  
								} );

		const sector = new Sector( this );
		sector.wall = wall1;

		
		const wall2 =	new Wall( { world:this, start:wall1, startAtEnd:true, end:null, endAtEnd:false
						, using:new Ray( new Vector( 0,y+0.5,0 ), new Vector( 1, 0 ) )
								} );
	
		const wall3 = new Wall( { world:this, start:wall1, startAtEnd:false, end:null, endAtEnd:true
						, using:new Ray( new Vector( 0,y-0.5,0 ), new Vector( 1, 0 ) )
								} )
		const wall4 = new Wall( { world:this, start:wall2, startAtEnd:true, end:wall3, endAtEnd:true
				, using:new Ray( new Vector( x+0.5,0 ), new Vector( 0, 1 ) )  
					} );
			
		sector.origin;
		sector.r.n.set( new Vector(0,1,0 ));
		//SetPoint( pSector.r.n, VectorConst_Y );
								
		
		const texture = this.getTexture( this.getName( "Default" ) );
		if( !texture.flags.bColor )
			texture.SetSolidColor( AColor( 170, 170, 170, 0x80 ) );
		sector.texture = texture;
		//MarkSectorUpdated( iWorld, iSector );
							
	}

	getName(name ) {
		for( n of this.names ) {
			if( n.name === name ) return n;
		}
		const newn = new Name();
		this.names.push(newn);
		newn.name = name;
		return newn;
	}
/*
	POBJECT object;

	PDATAQUEUE UpdatedLines;
	CRITICALSECTION csDeletions;
	struct all_flagset deletions;
*/
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
		jsox.fromJSOX( "~Wr", World );
		jsox.fromJSOX( "~S", Sector );
		jsox.fromJSOX( "~Wl", Wall );
		jsox.fromJSOX( "~L", Line );
		jsox.fromJSOX( "~N", Name );
		jsox.fromJSOX( "~T", Texture );
		jsox.fromJSOX( "v3", Vector );
	},
	setEncoders(jsox) {
		jsox.toJSOX( "~Wr", World );
		jsox.toJSOX( "~S", Sector );
		jsox.toJSOX( "~Wl", Wall );
		jsox.toJSOX( "~L", Line );
		jsox.toJSOX( "~N", Name );
		jsox.toJSOX( "~T", Texture );
		jsox.toJSOX( "v3", Vector );
	}
}

export {classes, World,Sector,Wall,Line,Name,Texture,UndoRecord}
