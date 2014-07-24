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
      hash = hash & hash;
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
      setText('', '');
      Kii.initializeWithSite('79fff252', '2f3af52fa90205787fb4d41bf48a175d',
        KiiSite.JP);

      function setText(t1, t2) {
        $scope.text1 = t1;
        $scope.text2 = t2;
      }

      function setEmptyText() {
        setText('', '');
      }

      function load(key, callbacks) {
        var uri = 'kiicloud://buckets/data1/objects/' + key;
        KiiObject.objectWithURI(uri).refresh({
          success: function (kiiobj) {
            var t1 = kiiobj.get('text1');
            var t2 = kiiobj.get('text2');
            if (t1 && t2) {
              callbacks.success(key, t1, t2);
            } else {
              console.log('ERROR: received incomplete data', t1, t2);
              callbacks.failure(key, 'received incomplete data');
            }
          },
          failure: function (kiiobj, errstr) {
            console.log('ERROR: load failed: ' + errstr);
            callbacks.failure(key, errstr);
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
        obj.refresh({
          success: function (obj) {
            if ($scope.text1 === obj.get('text1') &&
                $scope.text2 === obj.get('text2')) {
              callbacks.success(key, obj);
            } else {
              console.log('ERROR: key conflict:', key,
                'expected:', {
                  text1: $scope.text1,
                  text2: $scope.text2
                },
                'actually:', {
                  text1: obj.get('text1'),
                  text2: obj.get('text2')
                });
              callbacks.failure(key, obj, 'ERROR: key conflict');
            }
          },
          failure: function (obj, errstr) {
            save2(key, obj, callbacks);
          }
        });
      }

      function save2(key, obj, callbacks) {
        obj.set('text1', $scope.text1);
        obj.set('text2', $scope.text2);
        obj.saveAllFields({
          success: function (obj) {
            callbacks.success(key, obj);
          },
          failure: function (obj, errstr) {
            console.log('ERROR: save2 failed: ' + errstr);
            callbacks.failure(key, obj, errstr);
          }
        });
      }

      $scope.generateUrl = function () {
        var key = save({
          success: function (key, obj) {
            $location.search({k: key});
            $scope.$apply();
            _gaq.push(['_trackEvent', 'Save', 'Success', key]);
          },
          failure: function (key, obj, errstr) {
            $scope.$apply();
            _gaq.push(['_trackEvent', 'Save', 'Failure', key]);
            alert('共有に失敗しました\n\n詳細: ' + errstr);
          }
        });
      }

      function safeString(value1, value2) {
        return isEmpty(value1) ? value2 : value1;
      }

      function drawTextVertical(ctx, text, x, y, width, height) {

        // Measure each characters and layout it.
        var data = []; // [{ch, x, y, w, h}]
        var lines = text.split('\n');
        var curr = { x: 0, y: 0, maxWidth: 0, totalWidth: 0, maxWidth2: 0 };
        var totalWidth = 0;

        function lineFeed(curr) {
          if (curr.maxWidth > curr.maxWidth2) {
            curr.maxWidth2 = curr.maxWidth;
          }
          curr.x += curr.maxWidth + 12;
          curr.y = 0;
          curr.totalWidth += curr.maxWidth + 12;
          curr.maxWidth = 0;
        }

        for (var i = 0, M = lines.length; i < M; ++i) {
          curr.y = 0;
          var line = lines[i];
          for (var j = 0, N = line.length; j < N; ++j) {
            var ch = line.charAt(j);
            var m = ctx.measureText(ch);
            var w = m.width;
            var h = m.width;
            if ((curr.y + h) > height) {
              lineFeed(curr);
            }
            data.push({ ch: ch, x: curr.x, y: curr.y, w: w, h: h });
            if (curr.maxWidth < w) {
              curr.maxWidth = w;
            }
            curr.y += h;
          }
          lineFeed(curr);
        }

        // Draw characters.
        var right = x + width - (width - curr.totalWidth) / 2;
        var top = y;
        var maxWidth = curr.maxWidth2;
        for (var i = 0, M = data.length; i < M; ++i) {
          var item = data[i];
          ctx.fillText(item.ch,
              right - item.x - maxWidth + (maxWidth - item.w) /2,
              top + item.y + item.h);
        }
      }

      function drawHarukazeChan(ctx) {
        ctx.drawImage($('#bg_img')[0], 0, 0);
        ctx.font = 'bold 24px sans-serif';
        var t1 = safeString($scope.text1, 'お前が買ってきたアポロチョコ');
        var t2 = safeString($scope.text2, 'いちごの部分だけ全部食った！');
        drawTextVertical(ctx, t1, 425, 15, 200, 320);
        drawTextVertical(ctx, t2, 45, 50, 100, 200);
        return ctx;
      }

      $scope.onclick_saveAsImage = function () {
        // Create a canvas and draw on it.
        var canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        drawHarukazeChan(canvas.getContext('2d'));
        // Save canvas as a PNG image.
        var url = canvas.toDataURL();
        window.open(url, '外道はるかぜちゃん');
      }

      var search = $location.search();
      if (search['k']) {
        // Show empty text durling data load, to hide default texts.
        $scope.text1 = ' ';
        $scope.text2 = ' ';
        try {
          load(search.k, {
            success: function(key, t1, t2) {
              setText(t1, t2);
              $scope.$apply();
              _gaq.push(['_trackEvent', 'Load', 'Success', key]);
            },
            failure: function(key, errstr) {
              setEmptyText();
              $scope.$apply();
              _gaq.push(['_trackEvent', 'Load', 'Failure', key]);
            }
          });
        } catch (e) {
          // ignore.
          console.log(e);
        }
      }
    }
  ]);

})(window);
