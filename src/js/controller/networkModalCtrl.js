/* global myApp */
myApp.controller('networkModalCtrl', ['$rootScope', '$scope', 'SettingFactory', 'MonoeciApi',
                             function( $rootScope ,  $scope ,  SettingFactory ,  MonoeciApi ) {


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

  $scope.save = function() {
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
        location.reload();

      } catch (e) {
        console.error(e);
        $scope.network_error = e.message;
      }
    }
  };

}]);
