<?php
	$data = file_get_contents("php://input");
	$file = fopen("newOnsets.xml", "w") or die("Unable to create file!");
	fwrite($file, $data);
	fclose($file);
	echo "... il file XML con gli onset corretti è stato creato";
?>