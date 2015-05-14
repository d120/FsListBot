/*
 * fsListScraper
 *
 * parst fs@ und merkt sich nicht beantwortete Mails.
 *
 * Lizenz: GPL
 * Autor: Johannes Lauinger
 */

var mailin = require('mailin'),
    mongo = require('mongodb'),
    monk = require('monk'),
    db = monk('localhost:27017/fs'),
    express = require('express'),
    app = express(),
    mustache = require('mustache-express'),
    _ = require('underscore');

mailin.start({
  port: 25,
  disableWebhook: true
});

mailin.on('authorizeUser', function(connection, username, password, done) {
  done(new Error("Unauthorized!"), false);
});

mailin.on('message', function (connection, data, content) {
  var mails = db.get('mails');
  data.normalizedSubject = data.subject.toLowerCase().replace(/fwd:|re:|aw:|\[.*\]| /gi, '');
  data.from = data.from[0];
  // existiert zu dieser Nachricht schon ein Thread?
  mails.find({
    normalizedSubject: data.subject.toLowerCase().replace(/fwd:|re:|aw:|\[.*\]| /gi, '')
  }, {}, function (e, docs) {
    if (docs.length > 0) {
      var first = docs[docs.length - 1],
          recievedReply = false;
      // ist dies eine Nachricht an den Absender der Nachricht?
      if (_.any(data.to, function (i) {
        console.log (i.address + ' vs ' + first.from.address);
        return i.address == first.from.address;
      })) {
        recievedReply = true;
      }
      // diese Nachricht an den Thread anhängen
      first.replies.push(data);
      mails.update({
        normalizedSubject: data.subject.toLowerCase().replace(/fwd:|re:|aw:|\[.*\]| /gi, '')
      }, {
        $set: {
          replies: first.replies,
          done: first.done | recievedReply
        }
      });
      console.log('Followup message:' + (recievedReply ? ' Reply:' : '') + ' For ' + first.subject + ': ' + first.from.name + ' <' + first.from.address + '>: ' + data.subject);
    } else {
      // neuen Thread einfügen (diese Nachricht)
      data.replies = [];
      data.done = false;
      mails.insert(data);
      console.log('New thread: ' + data.from.name + ' <' + data.from.address + '>: ' + data.subject);
    }
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address,
      port = server.address().port;
  console.log('FsListBot for fs@ listening at http://%s:%s', host, port);
});

app.engine('html', mustache());
app.set('views', __dirname);
app.set('view engine', 'html');

app.get('/', function (req, res) {
  db.get('mails').find({}, {}, function (e, docs) {
    res.render('maillist', {
      'mails': docs
    });
  });
});
