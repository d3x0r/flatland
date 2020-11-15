


class Label {
	flags = { vertical : false };
	name = [];
}

//--------------------------------------------

class Texture {
	flags = { color : true };
       	color = null;
        name = null;
};

//--------------------------------------------

class Vector {
	x = 0;
        y = 0;
        z = 0;
}

class Ray {
	o = new Vector();
        n = new Vector();
}

class LineSeg {
	r = new Ray();
        from = 0;
        to = 0;        
	flags = { updated : false }
};

//--------------------------------------------



class Wall {
    flags = {
	bUpdating : false, // set this while updating to prevent recursion...
	wall_start_end : false, // wall_at_start links from wall_at_end
	   wall_end_end : false,   // wall_at_end links from wall_at_end
	   detached : false, // joined by joined FAR
	   bSkipMate: false, // used when updating sets of lines - avoid double update mating walls
	};
    world = null;
    sector = null;
    name = null;
    line = null;
    wallInto = null; // mate - to new sector
    wallStart = null; // in same sector, mating wall
    wallEnd = null; // in same sector, mating wall
}


//--------------------------------------------

class Sector {
	flags = {
		bBody : false,
	 bStaticBody : false,
	bUnused : false,
	bOpenShape : false, // should be drawn with lines not filled polygons (line/curve)
	};
        name = null;
        wall = null;
        ray = new Ray();
	texture = null;
        world = null;

	// processed point list...
	pointlist = [];
        facet = null;
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
	lines = [];
        walls = [];
        sectors = [];
        bodies = [];
        textures= [];
        firstUndo = null;
        firstRedo = null;
	name = null;
/*
	POBJECT object;

	PDATAQUEUE UpdatedLines;
	CRITICALSECTION csDeletions;
	struct all_flagset deletions;
*/
}

export {World,Sector,Wall,LineSeg,Label,Texture,UndoRecord}
