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
    _ = require('underscore');

mailin.start({
  port: 25,
  disableWebhook: true
});

mailin.on('authorizeUser', function (connection, username, password, done) {
  done(new Error("Unauthorized!"), false);
});

mailin.on('startMessage', function (connection) {
  console.log(connection);
});

mailin.on('message', function (connection, data, content) {
  console.log(connection);
  console.log(data);
  // Nur Mails an fs-scraper@trololol.org akzeptieren
  if ((data.headers.to + data.headers.cc).indexOf('fs-scraper@trololol.org') === -1) {
    //return;
  }
  var mails = db.get('mails');
  data.normalizedSubject = data.subject.toLowerCase().replace(/fwd:|re:|aw:|\[.*\]| /gi, '');
  data.from = data.from[0];
  data.isReply = false;
  data.uid = Date.now();
  // existiert zu dieser Nachricht schon ein Thread?
  mails.find({
    normalizedSubject: data.normalizedSubject
  }, {}, function (e, docs) {
    if (docs.length > 0) {
      var first = docs[docs.length - 1],
          recievedReply = false;
      // ist dies eine Nachricht an den Absender der Nachricht?
      if (_.any(data.to, function (i) {
        return i.address == first.from.address;
      })) {
        recievedReply = true;
        data.isReply = true;
      }
      // diese Nachricht an den Thread anhängen
      first.replies.push(data);
      mails.update({
        normalizedSubject: data.normalizedSubject
      }, {
        $set: {
          replies: first.replies,
          done: first.done || recievedReply
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

var server = app.listen(3000, 'localhost', function () {
  var host = server.address().address,
      port = server.address().port;
  console.log('FsListBot for fs@ listening at http://%s:%s', host, port);
});

app.use(express.static('public'));

app.get('/data', function (req, res) {
  db.get('mails').find({}, {
    sort: [
      ['done', 'asc'],
      ['date', 'desc']
    ]
  }, function (e, docs) {
    res.json(docs);
  });
});
