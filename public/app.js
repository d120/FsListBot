angular.module('fsListBot', [])
.controller('mailsCtrl', function ($scope, $http) {
  $scope.loading = true;
  $http.get('mails').then(function (res) {
    $scope.mails = res.data;
  }).finally(function () {
    $scope.loading = false;
  });

  $scope.toggleThread = function (item) {
    $http.put('mails/' + item.uid, {
      done: !item.done
    }).success(function (res) {
      item.done = !item.done;
    });
  };

  $scope.removeThread = function (item, index) {
    if (confirm('Diesen Thread wirklich unwiderruflich aus der Datenbank löschen?')) {
      $http.delete('mails/' + item.uid).success(function (res) {
        $scope.mails.splice(index, 1);
      });
    }
  };
})
.filter('moment', function() {
  return function (input) {
    return moment(input).format('LLLL');
  };
})
.filter('notdone', function() {
  return function (input) {
    return input.filter(function (x) {
      return !x.done;
    }).length;
  };
});

moment.locale('de');

$(function(){
  $(window).on('konami', function(){
    $('#wesen').animate({
      'transform': 'scale(12)'
    }, 1000).animate({
      opacity: 0
    }, 4000, function () {
      $(this).hide();
    });
  }).konami();
});
