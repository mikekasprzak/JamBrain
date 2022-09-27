<?php

function nodeCount_GetByNode( $nodes ) {
	$multi = is_array($nodes);
	if ( !$multi )
		$nodes = [$nodes];
	
	if ( is_array($nodes) ) {
		// Confirm that all Nodes are not zero
		foreach( $nodes as $node ) {
			if ( intval($node) == 0 )
				return null;
		}

		// Build IN string
		$node_string = implode(',', $nodes);

		$ret = db_QueryFetch(
			"SELECT node, count,
			FROM ".SH_TABLE_PREFIX.SH_TABLE_NODE_COUNT." 
			WHERE node IN ($node_string)"
		);
		
		if ( $multi )
			return $ret;
		else
			return $ret ? $ret[0] : null;
	}
	
	return null;
}

function nodeCount_AddByNode( $node, $author ) {
	if ( is_array($node) ) {
		return null;
	}
	
	if ( !$node )
		return null;
	
	return db_QueryInsert(
		"INSERT IGNORE INTO ".SH_TABLE_PREFIX.SH_TABLE_NODE_COUNT." (
			node,
			author,
			ip,
			timestamp
		)
		VALUES ( 
			?,
			?,
			INET6_ATON(?),
			NOW()
		);",
		$node,
		$author,
		$ip
	);
}
