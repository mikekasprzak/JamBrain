<?php

$wp = null;				///< The global database object

// General errors
function _wp_Error( $msg, $public = false ) {
    $unique = uniqid();
    $error = "shrub/src/wp/wp.php [$unique]: ".$msg;
    
    // Log the error to system log
    error_log($error);
    
    if ( php_sapi_name() === 'cli' ) {
        // CLI, we assume is private
        echo($error."\n");
    }
    else {
        require_once __DIR__."/json.php";
        json_EmitError(500, $public ? $error : "See Log [$unique]");
    }
}
function _wp_FatalError( $msg, $public = false ) {
    _wp_Error($msg, $public);
    exit;
}
    
// Database errors
function _wp_DBError( $public = false ) {
    global $wp;
    
    _wp_Error(isset($wp) ? mysqli_error($wp) : "NO $wp", $public);
}
function _wp_FatalDBError( $public = false ) {
    _wp_DBError($public);
    exit;
}

// Check if we have our constants
if ( !defined('WP_DB_HOST') ) {
    _wp_FatalError("WP_DB_HOST not set");
}
if ( !defined('WP_DB_NAME') ) {
    _wp_FatalError("WP_DB_NAME not set.");
}
if ( !defined('WP_DB_LOGIN') ) {
    _wp_FatalError("WP_DB_LOGIN not set.");
}
if ( !defined('WP_DB_PASSWORD') ) {
    _wp_FatalError("WP_DB_PASSWORD not set.");
}
define('_INI_MYSQLI_DEFAULT_PORT', ini_get("mysqli.default_port"));
define('_INI_MYSQLI_DEFAULT_SOCKET', ini_get("mysqli.default_socket"));


function _wp_IsConnected() {
	global $wp;
	return isset($wp);
}

/// Connect to the Database
function _wp_Connect(
	$host = WP_DB_HOST,
	$login = WP_DB_LOGIN,
	$password = WP_DB_PASSWORD,
	$name = WP_DB_NAME,
	$port = _INI_MYSQLI_DEFAULT_PORT,
	$socket = _INI_MYSQLI_DEFAULT_SOCKET
)
{
	// Safely call this multiple times, only the first time has any effect //
	if ( !_wp_IsConnected() ) {
		global $wp;
		$wp = mysqli_init();
		
		//mysqli_options($wp, ...);

		if ( defined('WP_DB_PORT') )
			$port = WP_DB_PORT;

		if ( defined('WP_DB_SOCKET') )
			$socket = WP_DB_SOCKET;
		
		$flags = null;

		// Connect to the database //
		mysqli_real_connect($wp, $host, $login, $password, $name, $port, $socket, $flags);
		
		// http://php.net/manual/en/mysqli.quickstart.connections.php
		if ($wp->connect_errno) {
    		_wp_Error("Failed to connect: (".$wp->connect_errno.") ".$wp->connect_error);
    	}
    	
    	// Set character set to utf8mb4 mode (default is utf8mb3 (utf8). mb4 is required for Emoji)
    	mysqli_set_charset($wp, 'utf8mb4');
    	// More info: http://stackoverflow.com/questions/279170/utf-8-all-the-way-through
	}
}

/// Connect to the MySQL Server only
function _wp_ConnectOnly(
	$host = WP_DB_HOST,
	$login = WP_DB_LOGIN,
	$password = WP_DB_PASSWORD,
	$port = _INI_MYSQLI_DEFAULT_PORT,
	$socket = _INI_MYSQLI_DEFAULT_SOCKET
)
{
	return _wp_Connect($host, $login, $password, "", $port, $socket);
}

/// Close the Connection
function _wp_Close() {
	// Safely call this multiple times, only the first time has any effect //
	if ( !_wp_IsConnected() ) {
		global $wp;
		mysqli_close($wp);
	}
}



// NOTE: Prepare statements are only faster in places you DON'T use the "in" keyword.
// Prepared statements as an optimization are only applicable when the query itself is identical.
function _wp_Prepare( $query ) {
    global $wp;
    return mysqli_prepare($wp, $query);
}

function _wp_BindExecute( &$st, $args ) {
    if ( count($args) > 0 ) {
        // Build the type string //
        $arg_types_string = "";
        foreach ( $args as &$arg ) {
            if ( is_integer($arg) ) {
                $arg_types_string .= 'i';
            }
            else if ( is_float($arg) ) {
                $arg_types_string .= 'd';
            }
            else if ( is_string($arg) ) {
                $arg_types_string .= 's';
            }
            else if ( is_bool($arg) ) {
                $arg_types_string .= 'i';
                $arg = $arg ? 1 : 0;
            }
            else if ( is_array($arg) ) {
                $arg_types_string .= 's';
                $arg = json_encode($arg,true);
            }
            else if ( is_null($arg) ) {
                $arg_types_string .= 's';
            }
            // date+time?
            else {
                _wp_FatalError("Unable to parse ".gettype($arg));
            }
        }
        
        $st->bind_param($arg_types_string, ...$args);
    }

    $ret = $st->execute();
    
    if ( !$ret || $st->errno ) {
        _wp_FatalDBError();
        $st->close();
        return false;
    }

    return true;
}



/// This, the underscore version doesn't close $st; It returns it instead
function _wp_Query( $query, $args ) {
	_wp_Connect();
		
	$st = _wp_Prepare($query);
	if ( $st && _wp_BindExecute($st, $args) ) {
		return $st;
	}
	_wp_DBError();
	return false;
}



/// @name Internal: Post-query extraction functions
function _wp_GetAssoc( &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC /*MYSQLI_NUM*/)) {
        $ret[] = $row;
    }
    return $ret;
}
/// Given a key (field name), populate an array using the value of the key as the index
function _wp_GetAssocStringKey( $key, &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC /*MYSQLI_NUM*/)) {
        $ret[$row[$key]] = $row;
    }
    return $ret;
}
/// Same as _wp_GetAssocStringKey, but assume the key is an integer, not a string
function _wp_GetAssocIntKey( $key, &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC /*MYSQLI_NUM*/)) {
        $ret[intval($row[$key])] = $row;
    }
    return $ret;
}
/// Same as _wp_GetAssocStringKey, but assume the key is a float, not a string
function _wp_GetAssocFloatKey( $key, &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC /*MYSQLI_NUM*/)) {
        $ret[floatval($row[$key])] = $row;
    }
    return $ret;
}
/// Get an array of arrays of elements (without names)
function _wp_GetArray( &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_NUM)) {
        $ret[] = $row;
    }
    return $ret;
}
/// Get an array of just the first element
function _wp_GetFirst( &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_NUM)) {
        $ret[] = $row[0];
    }
    return $ret;
}
/// Make a key=value pair array, where 0 is the key, and 1 is the value 
function _wp_GetPair( &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_NUM)) {
        $ret[$row[0]] = $row[1];
    }
    return $ret;
}
/// Same as _wp_GetPair, but make sure the key is an integer
function _wp_GetIntPair( &$st ) {
    $result = $st->get_result();
    $ret = [];
    while ($row = $result->fetch_array(MYSQLI_NUM)) {
        $ret[intval($row[0])] = $row[1];
    }
    return $ret;
}





/// @name Basic Query Functions
/// Takes a query string. Optionally replaces all ?'s with the additional arguments.
///
/// **NOTE:** Doxygen doesn't correctly understand PHP's `...$args` as a variadic argument. 
/// When you see `$args`, assume it's variadic (i.e. like printf, any number of optional arguments)
/// @{

/// Basic Query, for when the results don't matter.
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
function wp_Query( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		return $st->close();
	}
	return false;
}

/// Primarily for **INSERT** queries; Returns the Id
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Integer the Id of the item inserted (0 on failure)
function wp_QueryInsert( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$index = $st->insert_id;
		$st->close();
		return $index;
	}
	return 0;
}

/// Primarily for **DELETE** queries; Returns the number of rows changed
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Integer the number of rows that changed
function wp_QueryDelete( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$index = $st->affected_rows;
		$st->close();
		return $index;
	}
	return 0;
}

function wp_QueryUpdate( $query, ...$args ) {
	// NOTE: Doesn't actually delete. Just means it returns the number of rows changed
	return wp_QueryDelete( $query, ...$args ); // Calling non-internal function, so ...
}

/// For **true/false** queries; Returns the number of rows that match a query
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Integer the number of rows that match, null on failure
function wp_QueryNumRows( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		print_r($query);
		print_r($st);
		$rows = $st->num_rows;
		$st->close();
		return $rows;
	}
	return null;
}
/// @}

/// @name Fetch Query Functions
/// Like wp_Query, but returns the query result
/// @{

/// Return the result of the query
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Array[Array[String=>String]] an array of rows, each row an associative array of fields
function wp_QueryFetch( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetAssoc($st);
		$st->close();
		return $ret;
	}
	return null;
}

/// Return the result of the query, but as an array of values
function wp_QueryFetchArray( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetArray($st);
		$st->close();
		return $ret;
	}
	return null;
}

/// Fetch the first row (not the first field); Don't forget to add a **LIMIT 1**!
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Array[String=>String] an associative array of fields
function wp_QueryFetchFirst( $query, ...$args ) {
	$ret = wp_QueryFetch($query, ...$args); // Calling non-internal function, so ...
	if ( isset($ret[0]) )
		return $ret[0];
	return null;
}

/// Fetch the first field in each row, and return an array of values
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Array[String] an array of values
function wp_QueryFetchSingle( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetFirst($st);
		$st->close();
		return $ret;
	}
	return null;
}

/// Fetch a pair of fields, using the 1st as the **key**, 2nd as **value**
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Array[String=>String] an array of key=>values pairs
function wp_QueryFetchPair( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetPair($st);
		$st->close();
		return $ret;
	}
	return null;
}
/// Same as wp_QueryFetchPair, but both values are integers
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval Array[String=>String] an array of key=>values pairs, both values are integers
function wp_QueryFetchIntPair( $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetIntPair($st);
		$st->close();
		return $ret;
	}
	return null;
}

/// Fetch a single value, when there is only **one result**
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval String the value
function wp_QueryFetchValue( $query, ...$args ) {
	$ret = wp_QueryFetchSingle($query, ...$args); // Calling non-internal function, so ...
	if ( isset($ret[0]) ) {
		return $ret[0];
	}
	return null;	
}

/// Given a specific key, populate an array using that value as an integer key
/// @param [in] Integer $key ???
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval ???
function wp_QueryFetchWithIntKey( $key, $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetAssocIntKey($key, $st);
		$st->close();
		return $ret;
	}
	return null;
}
/// Given a specific key, populate an array using that value as a float key
/// @param [in] Float $key ???
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval ???
function wp_QueryFetchWithFloatKey( $key, $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetAssocFloatKey($key, $st);
		$st->close();
		return $ret;
	}
	return null;
}
/// Given a specific key, populate an array using that value as a string key
/// @param [in] String $key ???
/// @param [in] String $query MySQL query string
/// @param [in] ... (optional) String arguments
/// @retval ???
function wp_QueryFetchWithStringKey( $key, $query, ...$args ) {
	$st = _wp_Query($query, $args);
	if ( $st ) {
		$ret = _wp_GetAssocStringKey($key, $st);
		$st->close();
		return $ret;
	}
	return null;
}
