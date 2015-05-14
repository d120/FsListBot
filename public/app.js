angular.module('fsListBot', [])
.controller('mailsCtrl', function ($scope, $http) {
  $scope.loading = true;
  $http.get('data').then(function (res) {
    $scope.mails = res.data;
  }).finally(function () {
    $scope.loading = false;
  });

  $scope.toggleThread = function (item) {
    console.log('toggling thread with uid ' + item.uid);
    item.done = !item.done;
  };

  $scope.removeThread = function (item, index) {
    console.log('removing thread with uid ' + item.uid);
    $scope.mails.splice(index, 1);
  };
});
