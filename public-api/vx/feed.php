<?php
require_once __DIR__."/../config.php";

include_once __DIR__."/".CONFIG_PATH."config.php";
require_once __DIR__."/".SHRUB_PATH."api2.php";
require_once __DIR__."/".SHRUB_PATH."node/node.php";

const THINGS_I_CAN_FEED = [
	'post',
	'page',
	'item',
	'event',
	'group',
	'tag',
];

api_Exec([
["feed/get", API_GET, API_CHARGE_1, function(&$RESPONSE) { //:methods[/:root_node_id][/:type][/:subtype][/:subsubtype]
	if ( !json_ArgCount() ) {
		json_EmitFatalError_BadRequest("No method(s) specified", $RESPONSE);
	}

	// Score Operation (default: return everything, no score check)
	// Do this before methods, so methods can change it
	$score_op = null;
	if ( isset($_GET['max']) ) {
		$score_op = '<='.floatval($_GET['max']);
	}
	else if ( isset($_GET['min']) ) {
		$score_op = '>='.floatval($_GET['min']);
	}

	// Tags (as Ids)
	$RESPONSE['tags'] = null;
	if ( isset($_GET['tags']) ) {
		$RESPONSE['tags'] = array_map("intval", explode('+', $_GET['tags']));
	}

	// Methods
	$methods = json_ArgShift();
	$need_root = true;
	if ( empty($methods) ) {
		// Default
		$methods = ['parent'];
	}
	else {
		$methods = array_map("coreSlugify_Name", explode('+', $methods));

		$allowed_methods = [
			'parent',
			'superparent',
			'author',

			'all',
			'authors',

			'unpublished',
			'reverse',

			'cool',
			'smart',
			'grade',
			'feedback',

			'target',

			'grade-01-result',
			'grade-02-result',
			'grade-03-result',
			'grade-04-result',
			'grade-05-result',
			'grade-06-result',
			'grade-07-result',
			'grade-08-result',
		];

		// Confirm that each passed method is legal
		foreach ( $methods as &$method ) {
			// Tweak setup based on method name, or reinterpret synonyms
			switch ( $method ) {
				// most methods need the root node, except these
				case 'all': {
					$need_root = false;
					break;
				}
//				case 'authors': {
//					if ( count($methods) > 1 ) {
//						//json_EmitFatalError_BadRequest("Can't combine methods with all", $RESPONSE);
//					}
//					// totally fine, let it fall through
//					break;
//				}
				// Danger filter is just synonym for a grade
				case 'danger': {
					$method = 'grade';
					$score_op = '<='.floatval(19.9999);
					break;
				}
			}

			if ( !in_array($method, $allowed_methods) ) {
				json_EmitFatalError_BadRequest("Invalid method: $method", $RESPONSE);
			}
		}
	}
	$RESPONSE['method'] = $methods;

	// Root node (usually)
	$root = null;
	if ( $need_root ) {
		if ( json_ArgGet(0)[0] !== '$' ) {
			json_EmitFatalError_BadRequest("Root node id must use \$index format", $RESPONSE);
		}

		$root = intval(substr(json_ArgShift(), 1));	// $index format means skip first character ($)
		if ( $root <= 0 ) {
			json_EmitFatalError_BadRequest("Invalid root node id", $RESPONSE);
		}
		$RESPONSE['root'] = $root;
	}

	// Types
	$types = json_ArgShift();
	if ( empty($types) ) {
		// Default
		$types = ['post'];
	}
	else {
		$types = array_map("coreSlugify_Name", explode('+', $types));

		// Confirm this is a type I'm allowed to get feeds of
		foreach ( $types as &$type ) {
			if ( !in_array($type, THINGS_I_CAN_FEED) ) {
				json_EmitFatalError_BadRequest("Invalid type: $type", $RESPONSE);
			}
		}

		// Collapse array
		if ( count($types) == 1 )
			$types = $types[0];

		$RESPONSE['types'] = $types;
	}

	// Subtypes
	$subtypes = json_ArgShift();
	if ( !empty($subtypes) ) {
		$subtypes = array_map("coreSlugify_Name", explode('+', $subtypes));

		// Collapse array
		if ( count($subtypes) == 1 )
			$subtypes = $subtypes[0];

		$RESPONSE['subtypes'] = $subtypes;
	}

	// Subsubtypes
	$subsubtypes = json_ArgShift();
	if ( !empty($subsubtypes) ) {
		$subsubtypes = array_map("coreSlugify_Name", explode('+', $subsubtypes));

		// Collapse array
		if ( count($subsubtypes) == 1 )
			$subsubtypes = $subsubtypes[0];

		$RESPONSE['subsubtypes'] = $subsubtypes;
	}

	// Offset, Limit, and Reference Time (pagination)
	$RESPONSE['offset'] = 0;
	$RESPONSE['limit'] = 10;

	// ref as TZ DateTime
	$ref = str_replace('+00:00', 'Z', date(DATE_W3C, $_SERVER['REQUEST_TIME']));
	if ( isset($_GET['ref']) ) {
		$ref = $_GET['ref'];
		if ( $ref == 'null' ) {
			$ref = null;
		}
		else {
			// This will succeed if it's a valid date
			try {
				$ref = str_replace('+00:00', 'Z', (new DateTime($ref))->format(DateTime::W3C));
			}
			catch (Exception $e) {
				json_EmitFatalError_BadRequest("Invalid ref: ".$ref, $RESPONSE);
			}
		}
	}
	$RESPONSE['ref'] = $ref;

	// ref as Unix Time
	//$RESPONSE['ref'] = $_SERVER['REQUEST_TIME'];
	//if ( isset($_GET['ref']) ) {
	//	$RESPONSE['ref'] = intval($_GET['ref']);
	//}

	if ( isset($_GET['offset']) ) {
		$RESPONSE['offset'] = intval($_GET['offset']);
	}
	if ( isset($_GET['limit']) ) {
		$RESPONSE['limit'] = intval($_GET['limit']);
		if ( $RESPONSE['limit'] < 1 )
			$RESPONSE['limit'] = 1;
		if ( $RESPONSE['limit'] > 50 )
			$RESPONSE['limit'] = 50;
	}

	$RESPONSE['feed'] = nodeFeed_NewGetByMethod($methods, $root, $types, $subtypes, $subsubtypes, $RESPONSE['tags'], $score_op, $RESPONSE['limit'], $RESPONSE['offset'], $RESPONSE['ref']);
}],
]);

