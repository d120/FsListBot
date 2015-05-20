
function last_wednesday() {
  var time = new Date();
  do { time = new Date(+time-86400000) } while(time.getDay() != 3);
  return time;
}
function current_wednesday() {
  var time = new Date();
  while(time.getDay() != 3) time = new Date(+time-86400000);
  return time;
}
function format_date_iso(date) {
  return date.getFullYear() + "-" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)
      + "-" + (date.getDate() < 9 ? "0" : "") + date.getDate();
}
function current_pad_url() {
  return "https://www.fachschaft.informatik.tu-darmstadt.de/pad/?group=sitzung&show=Sitzung"
      + format_date_iso(current_wednesday()).replace(/-/g, '');
}
function rueckblick_url() {
  return "https://www.fachschaft.informatik.tu-darmstadt.de/wiki/Fachschaftssitzung/" 
      + format_date_iso(last_wednesday());
}

function on_resize() {
  $("iframe").css('height', $(window).height()-100  + 'px');
}
