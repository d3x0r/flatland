export class GameWorld {
	#playerList = [];
	#world = null;
	name = null;


	constructor( name ) {
		
		this.name = name;
	}
	
	get players() {
		return this.#playerList.length;
	}	
	set world(w) { this.#world = Promise.resolve(w) };
	get world() {
		if( !this.#world ) {
			this.#world = root.open( this.name ).then(file=>{
				return file.read().then( data=>{
					const w = ( data && JSOX.parse( data ) ) || new World();
					if( !w.sectors.length ){
						w.createSquareSector( 0, 0 );
						file.write( w );
					}
					setupWorldEvents( this, w );
					console.log( "Parsed:", w, data );
					return w;
				} )
			} ).catch( ()=>{
				const w = new World();
				w.createSquareSector( 0, 0 );
				setupWorldEvents( this, w );
				return root.open( this.name ).then( file=>{
					console.log( "writing initial file:", file, w );
				
					return file.write( JSOX.stringify( w ) ).then( ()=>w );
				} );
			} );
		}
		console.log( "world should be some sort of promise", this.#world)
		return this.#world;
	}	
	addPlayer(ws) {
		this.#playerList.push(ws);
	}
	delPlayer(ws) {
		var idx = this.#playerList.find( p=>p===ws );
		if( idx >= 0 )
			this.#playerList.splice(idx,1);
		else console.log( "Failed to find player to remove." );
	}
	send(from,msg) {
		for( let p = 0; p < this.#playerList.length; p++ )
		{
			const to = this.#playerList[p];
			if( to.readyState === 1)
				to.send(msg );
			else if( to.readyState == 3 ){
				this.#playerList.splice(p, 1 );
				p--; // recheck this spot.
			}
		}
	}
}
