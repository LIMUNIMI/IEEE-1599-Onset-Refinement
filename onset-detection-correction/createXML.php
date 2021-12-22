<?php
	//retrieving data
	$data = explode('|||', file_get_contents("php://input"), 2);
	$filename = "../NEW_" . $data[0];
	$document = $data[1];

	// creating the file
	$file = fopen($filename, "w") or die("Unable to create file!");
	fwrite($file, $document);
	fclose($file);
	
	// sending a response
	echo json_encode("<b>Il file XML con gli onset corretti è stato creato!</b><br>");
?>

