;(function (global) {
  'use strict';

  var app = angular.module('gedouApp', []);

  app.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  });
  app.controller('gedouCtrl', ['$scope', '$location',
    function ($scope, $location) {
      function decode(data) {
        var json = Base64.btou(RawDeflate.inflate(Base64.fromBase64(data)));
        var raw = JSON.parse(json);
        // XXX: read data from storage.
        if (raw[0] && raw[1]) {
          $scope.text1 = raw[0];
          $scope.text2 = raw[1];
        }
      }

      function encode() {
        var raw = [$scope.text1, $scope.text2];
        if (raw[0] == null || raw[1] == null) {
          return null;
        }
        // XXX: persist raw to storage with key.
        var json = JSON.stringify(raw);
        var b64 = Base64.toBase64(RawDeflate.deflate(Base64.utob(json)));
        return b64;
      }

      $scope.generateUrl = function () {
        var data = encode();
        if (data) {
          $location.search({d: encode()});
          window.location.href = $location.url();
        }
      }

      var search = $location.search();
      if (search['d']) {
        try {
          decode(search.d);
        } catch (e) {
          // ignore.
        }
      }
    }
  ]);

})(window);
