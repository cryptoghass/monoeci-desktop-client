/* global myApp */

myApp.controller("SettingsCtrl", ['$scope', '$rootScope', 'SettingFactory', 'MonoeciApi',
                         function( $scope ,  $rootScope ,  SettingFactory ,  MonoeciApi ) {
    $scope.mode = 'federation';
    $scope.isMode = function(mode) {
      return $scope.mode === mode;
    }
    $scope.setMode = function(mode) {
      return $scope.mode = mode;
    }

    $scope.proxy = SettingFactory.getProxy();

    $scope.active_network = SettingFactory.getNetworkType();
    $scope.active_horizon = SettingFactory.getMonoeciUrl();
    $scope.active_passphrase = SettingFactory.getNetPassphrase();
    $scope.active_coin = SettingFactory.getCoin();
    $scope.network_type = SettingFactory.getNetworkType();
    $scope.network_horizon = SettingFactory.getMonoeciUrl();
    $scope.network_passphrase = SettingFactory.getNetPassphrase();
    $scope.network_coin = SettingFactory.getCoin();
    $scope.all_networks = SettingFactory.NETWORKS;

    $scope.fed_network = SettingFactory.getFedNetwork();
    $scope.fed_ripple  = SettingFactory.getFedRipple();
    $scope.fed_bitcoin = SettingFactory.getFedBitcoin();
    $scope.set = function(type) {
      $scope.network_type = type;
      $scope.network_horizon = SettingFactory.getMonoeciUrl(type);
      $scope.network = SettingFactory.NETWORKS[type];
      if(type === 'other') {
        $scope.network_passphrase = SettingFactory.getNetPassphrase(type);
        $scope.network_coin = SettingFactory.getCoin(type);
      }
    }
    $scope.save = function(mode) {
      $scope.network_error = "";
      if (mode == 'network') {
        if ($scope.active_network !== $scope.network_type ||
            $scope.active_horizon !== $scope.network_horizon ||
            $scope.active_passphrase !== $scope.network_passphrase ||
            $scope.active_coin !== $scope.network_coin) {
          try {
            SettingFactory.setNetworkType($scope.network_type);
            SettingFactory.setMonoeciUrl($scope.network_horizon);
            SettingFactory.setNetPassphrase($scope.network_passphrase);
            SettingFactory.setCoin($scope.network_coin);

            $scope.active_network = SettingFactory.getNetworkType()
            $scope.active_horizon = SettingFactory.getMonoeciUrl()
            $scope.active_passphrase = SettingFactory.getNetPassphrase()
            $scope.active_coin = SettingFactory.getCoin()

            MonoeciApi.setServer($scope.active_horizon, $scope.active_passphrase, SettingFactory.getAllowHttp());
            MonoeciApi.logout();
            $rootScope.reset();
            $rootScope.$broadcast('$authUpdate');  // workaround to refresh and get changes into effect.
            setTimeout(function(){
              window.location.reload();
            },100);

          } catch (e) {
            console.error(e);
            $scope.network_error = e.message;
          }
        }
      }

      if (mode == 'federation') {
        SettingFactory.setFedNetwork($scope.fed_network);
        SettingFactory.setFedRipple($scope.fed_ripple);
        SettingFactory.setFedBitcoin($scope.fed_bitcoin);
      }

      if (mode == 'proxy') {
        SettingFactory.setProxy($scope.proxy);
      }
    };

    $scope.fed_name = "";
    $scope.resolveFed = function() {
      MonoeciApi.getFedName($scope.fed_network, $rootScope.address, function(err, name){
        if (err) {
          console.error(err);
        } else {
          $scope.fed_name = name;
          $scope.$apply();
        }
      });
    };
    $scope.resolveFed();
  } ]);
