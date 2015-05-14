angular.module('fsListBot', [])
.controller('mailsCtrl', function ($scope, $http) {
  $scope.loading = true;
  $http.get('mails').then(function (res) {
    $scope.mails = res.data;
  }).finally(function () {
    $scope.loading = false;
  });

  $scope.toggleThread = function (item) {
    console.log('toggling thread with uid ' + item.uid);
    $http.put('mails/' + item.uid, {
      done: !item.done
    }).success(function (res) {
      item.done = !item.done;
    });
  };

  $scope.removeThread = function (item, index) {
    console.log('removing thread with uid ' + item.uid);
    $http.delete('mails/' + item.uid).success(function (res) {
      $scope.mails.splice(index, 1);
    });
  };
});
