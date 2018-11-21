/* global myApp */
myApp.controller('proxyModalCtrl', ['$rootScope', '$scope', 'SettingFactory', 'MonoeciApi',
                             function( $rootScope ,  $scope ,  SettingFactory ,  MonoeciApi ) {


  $scope.proxy = SettingFactory.getProxy();

  $scope.save = function() {
    SettingFactory.setProxy($scope.proxy);
    location.reload();
  };

}]);
