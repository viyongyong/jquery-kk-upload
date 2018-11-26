<?php

$typeArr = array("jpg", "png", "gif");
$path = "files/";
if (isset($_POST)) {
  $name = $_FILES['file']['name'];
  $size = $_FILES['file']['size'];
  $name_tmp = $_FILES['file']['tmp_name'];
  if (empty($name)) {
	  echo json_encode(array("error"=>"您还未选择图片"));
	  exit;
  }
  $type = strtolower(substr(strrchr($name, '.'), 1)); //获取文件类型

  if (!in_array($type, $typeArr)) {
	  echo json_encode(array("error"=>"清上传jpg,png或gif类型的图片！"));
	  exit;
  }
  if ($size > (1024 * 1024 * 10)) {
	  echo json_encode(array("error"=>"图片大小已超过10MB！"));
	  exit;
  }

  $pic_name = time() . rand(10000, 99999) . "." . $type;
  $pic_url = $path . $pic_name;
  if (move_uploaded_file($name_tmp, $pic_url)) {
	  echo json_encode(array("error"=>"0","pic"=>$name,"name"=> '/php'.$pic_name));
  } else {
	  echo json_encode(array("error"=>"上传有误，清检查服务器配置！"));
  }
}
