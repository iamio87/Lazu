//// hashCode has identical function on python side
//// python uses unsigned 32-bit; javascript uses signed 32-bit.

function HashList(list){
	var hash = 0;
	list.map(function(int, index){
		hash += parseInt(int);
//		console.log(hash, hash>>>1)
		hash += (hash << 10)>>>1;
//		console.log(hash, hash>>>1)
		hash ^= (hash >>> 6);
//		console.log(hash, hash>>>1)
		hash = hash<<1 >>>1;
//		console.log(hash, hash>>>1)
	})
//	console.log(hash)
	hash += hash << 3;
//	console.log(hash, hash>>>1)
	hash ^= hash >>> 11;
//	console.log(hash, hash>>>1)
	hash += hash << 15;
	hash = (hash >>>1)
//	console.log(hash, hash>>>1)
	return hash
}
