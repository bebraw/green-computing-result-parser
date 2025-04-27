<?php

// Read in sitelist.csv and remove extra lines at the bottom and the header
$sites = file('sitelist.csv');
$l = count($sites);
for($i = 101; $i < $l; $i++) {
	unset($sites[$i]);
}
unset($sites[0]);
$sites = array_values($sites);

$countries = array('USA' => 'US', 'Finland' => 'FI', 'Sweden' => 'SV', 'UK' => 'UK', 'Germany' => 'DE');
$industries = array('Mass media' => 'MED', 'Retail' => 'RET', 'Government' => 'GOV', 'Sports' => 'SPO');

// Explode each line and remove extra columns
$l = count($sites);
for($i = 0; $i < $l; $i++) {
	$tmp = explode(',', $sites[$i]);
	//	unset($tmp[1]);
	//	unset($tmp[2]);
	unset($tmp[3]);
	unset($tmp[4]);
	unset($tmp[5]);
	unset($tmp[6]);
	unset($tmp[9]);
	unset($tmp[10]);
	$sites[$i] = array_values($tmp);
}

// Create scripts
$scripts = array();
$check = array(array(), array(), array(), array(), array());

createScripts(1, $sites, array(0, 1, 2, 3, 4), $scripts, $check);
createScripts(2, $sites, array(1, 3, 0, 4, 2), $scripts, $check);
createScripts(3, $sites, array(2, 4, 3, 1, 0), $scripts, $check);
createScripts(4, $sites, array(3, 2, 4, 0, 1), $scripts, $check);
createScripts(5, $sites, array(4, 0, 1, 2, 3), $scripts, $check);

$checkUnique = array(array_unique($check[0]), array_unique($check[1]), array_unique($check[2]), array_unique($check[3]), array_unique($check[4]));

if(count($check[0]) != count($checkUnique[0]) ||
   count($check[1]) != count($checkUnique[1]) ||
   count($check[2]) != count($checkUnique[2]) ||
   count($check[3]) != count($checkUnique[3]) ||
   count($check[4]) != count($checkUnique[4])) {
	echo "Error: not balanced scripts.\n";
}

echo "Scripts saved.\n";

foreach($scripts as $k => $v) {
	$f = 'scripts/measure' . str_pad(($k + 1), 3, '0', STR_PAD_LEFT) . '.sh';

	// Pick Germany
	if (!(($k + 1) % 5)) {
		file_put_contents($f, $v);
		chmod($f, 0755);
	}
}

function createScripts($round, &$sites, $order, &$scripts, &$check) {
	global $countries, $industries;
	
	$l = count($sites);
	for($i = 0; $i < $l / 5; $i++) {
		$s = '';
		for($j = 0; $j < 5; $j++) {
			$cat = $countries[$sites[$i * 5 + $order[$j]][2]] . '-' .
				$industries[$sites[$i * 5 + $order[$j]][1]];
			$s .= './measure.sh ' . str_pad($i * 5 + $order[$j] + 1, 3, '0', STR_PAD_LEFT) . ' https://' . $sites[$i * 5 + $order[$j]][0] . ' ' . $round . ' ' . $cat . ' "' . $sites[$i * 5 + $order[$j]][3] . '" "' . $sites[$i * 5 + $order[$j]][4] . "\"\n";
			array_push($check[$j], $sites[$i * 5 + $order[$j]][0]);
		}
		array_push($scripts, $s);
	}
}
