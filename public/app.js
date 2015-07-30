angular.module('fsListBot', [])
.controller('mailsCtrl', function ($scope, $http) {
  moment.locale('de');

  $scope.loading = true;
  $scope.mails = [];
  $scope.since = moment(last_wednesday()).format('DD. MMMM YYYY');

  $scope.$watch('selectedMonth', function() {
    $scope.loading = true;
    $http.get('mails?month=' + $scope.selectedMonth).then(function (res) {
      $scope.mails = res.data;
    }).finally(function () {
      $scope.loading = false;
    });
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

  $scope.months = [];
  var month = moment();
  for(var i = 0; i < 50; i++) {
      $scope.months.push(month.locale('en').format('YYYY-MMMM'));
      month = month.subtract(1, 'month');
  }
  $scope.selectedMonth = $scope.months[0];

  $(function(){
    $('.datepicker').datetimepicker({
      locale: 'de',
      format: 'LL'
    }).on('dp.change', function(){
      $('#since').blur();
    });
    $('#since').blur(function(e){
      $scope.since = $('#since').val();
      $scope.$apply();
    });

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
})
.filter('moment', function() {
  return function (input) {
    return moment(input).format('LLLL');
  };
})
.filter('laterThan', function() {
  return function (input, since) {
    return input.filter(function (x) {
      return moment(since, 'LL').isBefore(moment(x.date));
    });
  };
})
.filter('notdone', function() {
  return function (input) {
    return input.filter(function (x) {
      return !x.done;
    }).length;
  };
});
