<?php
$BASE_URL = $_SERVER['SCRIPT_NAME'];
mb_internal_encoding("UTF-8");
ini_set("display_errors","on");
$menu = array(
  '/' => 'Unbeantwortete E-Mails',
  '/protokoll' => 'Rückblick',
  '/inbox' => 'Inbox',
  '/sitzungspad' => 'Sitzungspad',
  '/kalender' => 'Kalender'
);

$dbh = new PDO('sqlite:data/mailinfo.db');
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$path = @$_SERVER['PATH_INFO'];

if (preg_match("#^/mails/([a-z0-9]+)$#", $path, $matches)) {
  $mail_id = $matches[1];
  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
    $put_data = json_decode(file_get_contents("php://input"));
    header("Content-Type: application/json");
    $dbh->prepare("DELETE FROM mails WHERE mail_id = ?")->execute(array($mail_id));
    if ($put_data->done) $dbh->prepare("INSERT INTO mails (mail_id, done) VALUES (?, 1)")->execute(array($mail_id));
    echo json_encode(array("success" => true));
  } else if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    header("Content-Type: application/json");
    $dbh->prepare("DELETE FROM mails WHERE mail_id = ?")->execute(array($mail_id));
    $dbh->prepare("INSERT INTO mails (mail_id, deleted) VALUES (?, 1)")->execute(array($mail_id));
    echo json_encode(array("success" => true));
  }
  return;
}

switch($path) {
  case '':
    header("Location: $BASE_URL/");
    break;
  case '/mails':
    header("Content-Type: application/json");
    if (!preg_match('#^[0-9]{4}-[a-zA-Z]+$#', @$_GET['month'])) { header("HTTP/1.1 400 Bad Request"); die(json_encode(array("error" => "Bad Request"))); }
    $file = '/var/lib/mailman/archives/private/fs/' . $_GET['month'] . '.txt';
    $all_mails = read_mbox($file);
    $references = array();
    $mails = array();
    foreach($all_mails as $m) {
      $id = $m['header']['Message-ID'][0];
      $q = $dbh->prepare('SELECT * FROM mails WHERE mail_id = ?');
      $q->execute(array(md5($id)));
      $dbinfo = $q->fetch();
      if ($dbinfo && $dbinfo["deleted"]) continue;
      $mail = array("from" => array("name" => $m['header']['From'][0]),
                    "date" => $m['header']['Date'][0],
		    "done" => $dbinfo && $dbinfo['done'],
		    "subject" => implode("", $m['header']['Subject']),
		    "id" => $id,
		    "replyToId" => isset($m['header']['In-Reply-To']) ? $m['header']['In-Reply-To'][0]  : false,
		    "isReply" => isset($m['header']['In-Reply-To']),
		    "normalizedSubject" => "zzz".md5($id),
		    "uid" => md5($id),
		    "headers" => $m['header'],
 		    "text" => $m['body'],);
      if ($mail["isReply"] && isset($references[$mail["replyToId"]])) {
        $replyTo = $references[$mail["replyToId"]];
        $mails[$replyTo]['replies'][] = $mail;
	$references[$id] = $replyTo;
      } else {
        $mails[$id] = $mail;
	$references[$id] = $id;
      }
    }
    echo json_encode(array_reverse(array_values($mails)));
    #echo json_encode(array("data" => $mails));
    break;
  default:
    if (show_file('public', $path)) {
    } else if (show_file('vendor', $path)) {
    } else {
      show_page($path);
    }
    break;
}

function show_file($dir, $filename) {
  $dir = dirname(__FILE__) . '/' . $dir;
  $path = realpath($dir . $filename);
  if ($path && is_file($path) && strpos($path, $dir) === 0) {
    if (preg_match('#\.css$#', $path)) header("Content-Type: text/css");
    if (preg_match('#\.js$#', $path)) header("Content-Type: text/javascript");
    header("Cache-Control: max-age=9001000, public");
    readfile($path);
    return true;
  }// var_dump($path);
}

function show_page($name) {
  $menuHtml = "";
  foreach($GLOBALS['menu'] as $url => $text) {
    $menuHtml .= "<li class=\"".($url==$name?"active":"")."\"><a href='$GLOBALS[BASE_URL]$url'>$text</a></li>";
  }
  $code = file_get_contents("html/template.html");
  $title = @$GLOBALS['menu'][$name];
  if ($title) {
    if ($name == '/') $name = '/index';
    $contents = file_get_contents('html' . $name . '.html');
  } else {
    header("HTTP/1.1 404 Not Found");
    $title = "Not found";
    $contents = "<div class=container><h2>File Not Found</h2></div>";
  }
  $code = str_replace("{{title}}", $title, $code);
  $code = str_replace("{{menu}}", $menuHtml, $code);
  $code = str_replace("{{content}}", $contents, $code);
  echo $code;
}

function read_mbox($file) {
  $fh = fopen($file, "r");
  if (!$fh) return false;
  $mails = array(); $lastheader = ""; $mail = false;
  $line = trim(fgets($fh));
  while(!feof($fh)) {
    if ($mail) array_push($mails, $mail);
    $mail = array("header" => array(), "body" => "");
    if (strpos($line, 'From ') === 0) {
      while(!feof($fh)) {
        $line = trim(fgets($fh));
	if ($line == "") break;
        $parts = explode(":", $line, 2); 
	if (count($parts) == 2) {
	  $lastheader = $parts[0];
          $mail["header"][$parts[0]][] = mb_decode_mimeheader(ltrim($parts[1]));
	} else {
	  $mail["header"][$lastheader][] = mb_decode_mimeheader(ltrim($parts[0]));
	}
      }
      while(!feof($fh)) {
        $line = trim(fgets($fh));
	if (strpos($line, 'From ') === 0) continue 2;
        $mail["body"] .= utf8_encode($line) . "\n";
      }
    }
    $line = trim(fgets($fh));
  }
  if ($mail) array_push($mails, $mail);
  return $mails;
}

