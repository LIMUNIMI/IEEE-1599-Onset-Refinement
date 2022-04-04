<?php

	//retrieving data
	$data = explode('|||', file_get_contents("php://input"), 2);
	$filename = "../xml-docs-output/OUT_" . $data[0];
	$document = $data[1];

	// creating the file
	$file = fopen($filename, "w") or die("Unable to create file!");
	fwrite($file, $document);
	fclose($file);
	
	// sending a response
	echo json_encode("... il file XML con gli onset corretti è stato creato");

?>