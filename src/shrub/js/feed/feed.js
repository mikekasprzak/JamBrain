import Fetch			 				from '../internal/fetch';

export default {
	Get,
};

export function Get( methods, id, types, subtypes, subsubtypes, tags, more, limit, ref ) {
	let args = [];

	if ( methods ) {
		if ( Array.isArray(methods) ) {
			methods = methods.join("+");
		}
		args.push(methods);
	}

	args.push('$'+id);

	// Tree of types
	if ( types ) {
		if ( Array.isArray(types) ) {
			types = types.join("+");
		}
		args.push(types);

		if ( subtypes ) {
			if ( Array.isArray(subtypes) ) {
				subtypes = subtypes.join("+");
			}
			args.push(subtypes);

			if ( subsubtypes ) {
				if ( Array.isArray(subsubtypes) ) {
					subsubtypes = subsubtypes.join("+");
				}
				args.push(subsubtypes);
			}
		}
	}

	var query = [];

	if ( tags ) {
		if ( tags.length && tags.join ) {
			query.push("tags="+tags.join('+'));
		}
		else {
			query.push("tags="+tags);
		}
	}

	if ( more ) {
		query.push("offset="+more);
	}
	if ( limit ) {
		query.push("limit="+limit);
	}
	if ( ref ) {
		query.push("ref="+ref);
	}

	if ( query.length )
		query = "?"+query.join('&');

	return Fetch.Get(API_ENDPOINT+'/vx/node/feed/'+args.join('/')+query, true)
		.then( r => {
			return r;
		});
}
