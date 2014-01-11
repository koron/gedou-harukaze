;(function (global) {
  'use strict';

  var app = angular.module('gedouApp', []);

  app.controller('gedouCtrl', ['$scope',
    function ($scope) {
      $scope.generateUrl = function () {
        console.log('HERE', $scope.text1, $scope.text2);
      }
    }
  ]);

})(window);
