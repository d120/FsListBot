
function last_wednesday(start) {
  var time = start ? start : new Date();
  do { time = new Date(+time-86400000) } while(time.getDay() != 3);
  return time;
}
function next_wednesday(start) {
  var time = start ? start : new Date();
  do { time = new Date(+time+86400000) } while(time.getDay() != 3);
  return time;
}
function current_wednesday() {
  var time = new Date();
  if (new Date().getDay() == 3) return time;
  return last_wednesday(time);
}
function format_date_iso(date) {
  return date.getFullYear() + "-" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)
      + "-" + (date.getDate() < 9 ? "0" : "") + date.getDate();
}
function protokoll_pad_url(date) {
  return "https://www.fachschaft.informatik.tu-darmstadt.de/pad/?group=sitzung&show=Sitzung"
      + format_date_iso(date ? date : current_wednesday()).replace(/-/g, '');
}
function protokoll_wiki_url(date) {
  return "https://www.fachschaft.informatik.tu-darmstadt.de/wiki/Fachschaftssitzung/" 
      + format_date_iso(date ? date : last_wednesday());
}

function on_resize() {
  $("iframe").css('height', $(window).height()-100  + 'px');
}
