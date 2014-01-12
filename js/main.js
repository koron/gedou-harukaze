;(function (global) {
  'use strict';

  var app = angular.module('gedouApp', []);

  function isEmpty(s) {
    if (!s || s === '') {
      return true;
    } else {
      return false;
    }
  }

  function hashCode(s) {
    var hash = 0;
    for (var i = 0; i < s.length; ++i) {
      var ch = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
    }
    return hash;
  }

  function plusCode(n) {
    return n + 0x7fffffff + 1;
  }
  global.plusCode = plusCode;

  function calcKey(a, b, c) {
    if (isEmpty(a) || isEmpty(b)) {
      return '';
    }
    if (!c) {
      c = '';
    }
    var ha = plusCode(hashCode(a));
    var hb = plusCode(hashCode(b));
    var hc = plusCode(hashCode(c));
    return (new Hashids()).encrypt(ha, hb, hc);
  }

  app.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  });

  app.controller('gedouCtrl', ['$scope', '$location',
    function ($scope, $location) {
      $scope.text1 = '';
      $scope.text2 = '';
      Kii.initializeWithSite('79fff252', '2f3af52fa90205787fb4d41bf48a175d',
        KiiSite.JP);

      function setText(t1, t2) {
        $scope.text1 = t1;
        $scope.text2 = t2;
        $scope.$apply();
      }

      function setEmptyText() {
        setText('', '');
      }

      function load(key) {
        var uri = 'kiicloud://buckets/data1/objects/' + key;
        KiiObject.objectWithURI(uri).refresh({
          success: function (kiiobj) {
            var t1 = kiiobj.get('text1');
            var t2 = kiiobj.get('text2');
            if (t1 && t2) {
              setText(t1, t2);
            } else {
              setEmptyText();
            }
          },
          failure: function (kiiobj, errstr) {
            console.log('ERROR: load failed: ' + errstr);
            setEmptyText();
          }
        });
      }

      function save(callbacks) {
        var key = calcKey($scope.text1, $scope.text2, '');
        if (isEmpty(key)) {
          return null;
        }
        var uri = 'kiicloud://buckets/data1/objects/' + key;
        var obj = KiiObject.objectWithURI(uri);
        obj.set('text1', $scope.text1);
        obj.set('text2', $scope.text2);
        obj.saveAllFields({
          success: function (obj) {
            callbacks.success(key, obj);
          },
          failure: function (obj, errstr) {
            console.log('ERROR: save failed: ' + errstr);
            callbacks.failure(key, obj, errstr);
          }
        });
      }

      $scope.generateUrl = function () {
        var key = save({
          success: function (key, obj) {
            $location.search({k: key});
          },
          failure: function (key, obj, errstr) {
            alert('共有に失敗しました\n\n詳細: ' + errstr);
          }
        });
      }

      var search = $location.search();
      if (search['k']) {
        try {
          load(search.k);
        } catch (e) {
          // ignore.
          console.log(e);
        }
      }
    }
  ]);

})(window);
