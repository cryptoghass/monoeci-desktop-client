/* global $, CONST, myApp, require */

myApp.controller('LoginCtrl', ['$scope', '$rootScope', '$window', '$location', 'AuthenticationFactory', 'SettingFactory', 'hardwareWalletDaemon', 'MonoeciApi',
                      function( $scope ,  $rootScope , $window,  $location ,  AuthenticationFactory ,  SettingFactory ,  hardwareWalletDaemon, MonoeciApi ) {

  $scope.ledgerInvalid = true;
  $scope.ledgerError = '';

  if($window.localStorage['launched'] == undefined) {
    $location.path("/network_settings");
  }

  $scope.fileInputClick = function() {
    const remote = require('electron').remote;
    var dialog = remote.dialog;

    dialog.showOpenDialog({
        properties: [ 'openFile' ]
      }, function ( filenames ) {
        $scope.$apply(function() {
          $scope.walletfile = filenames.shift();
        });
      }
    );
  };

  $scope.submitForm = function(){
    if (!$scope.walletfile) {
      $scope.error = 'Please select a wallet file.';
      return;
    }
    $scope.backendMessages = [];

    const type = AuthenticationFactory.TYPE.FILESYSTEM;
    AuthenticationFactory.load(type, {path: $scope.walletfile, password: $scope.password}, (err) => {
      $scope.$apply(() => {
        if (err) {
          console.error(err)
          $scope.error = 'Login failed: Wallet file or password is wrong.';
          return;
        }

        $location.path('/');
      });
    });
  }

  $scope.invalidMonoeciPublickey = true;
  $scope.$watch('walletAddress', function(newValue){
    if(newValue != '' && newValue != undefined) {
      if(MonoeciApi.isValidAddress(newValue)) {
        $scope.invalidMonoeciPublickey = false;
      } else {
        $scope.invalidMonoeciPublickey = true;
      }
    } else {
      $scope.invalidMonoeciPublickey = true;
    }
  }, true);

  $scope.submitAddress = function(){
    const type = AuthenticationFactory.TYPE.TEMPORARY;
    AuthenticationFactory.load(type, {address: $scope.walletAddress}, (err) => {
      $scope.$apply(() => {
        if (err) {
          console.error(err)
          $scope.error = `Login failed: ${err}`;
          return;
        }

        $location.path('/');
      });
    });
  }

  $scope.openProxySettings = function() {
    $(`#proxyModal`).modal();
  }


  /** START: Network settings **/
  $scope.openNetworkSettings = function() {
    $(`#networkModal`).modal();
  }

  $scope.network_passphrase = SettingFactory.getNetPassphrase();
  /** END: Network settings **/




  /** START: Hardware wallet login **/
  $scope.addressInputDisabled = true;
  $scope.continue = 'Continue';
  $scope.ledgerError = {
    type: '',
    error: ''
  }
  $scope.ledgerForm = {
    selectedDropdown: 'Default account',
    otherAccountInput: '0',
    address: 'loading address..',
    subaccount: 0,
  }
  $scope.addresses = []

  const refreshAddress = (newValue, oldValue) => {
    if($scope.ledgerForm.address !== 'loading address..') {
      if(oldValue.otherAccountInput === newValue.otherAccountInput) return;  // Filter out duplicates.
      if(newValue.otherAccountInput === '') return;
      if(isNaN(Number(newValue.otherAccountInput))) return;
    }

    Promise.resolve()
      .then(()=>hardwareWalletDaemon.getPublicKey(newValue.otherAccountInput))
      .then((pk)=>{
        $scope.ledgerForm.address = 'loading address..';
        $scope.ledgerForm.subaccount = Number(newValue.otherAccountInput);
        $scope.ledgerForm.address = pk;
        $scope.$apply();
        console.info(`Account No.${newValue.otherAccountInput} = ${pk}`)
      })
  };
  // refreshAddress($scope.ledgerForm, {})
  $scope.$watch('ledgerForm', refreshAddress, true)


  $('.btn-connect').on('click', function() {
    $scope.ledgerError = { type: '', error: '' }
    var $this = $(this);
    $this.button('loading');
      setTimeout(function() {
        $this.button('reset');
        $scope.ledgerError = { type: 'danger', error: 'The request timed out' }
        $scope.$apply();
      }, 8000);
  });

  $scope.onDropdownChange = function(title, key) {
    $scope.ledgerForm.selectedDropdown = title;
    if(key !== undefined) {
      $scope.addressInputDisabled = true;
      // const chosenOne = $scope.addresses[key];
      // $scope.ledgerForm.address = chosenOne;
      // $scope.ledgerForm.subaccount = Number(key);
      $scope.ledgerForm.otherAccountInput = key;
    } else {
      $scope.addressInputDisabled = false;
    }
  }

  $scope.HWAddressLogin = async () => {
    $scope.continue = 'Please confirm account in Ledger device...';
    const address = $scope.ledgerForm.address;

    try {
      const activeWallet = (await hardwareWalletDaemon.activeWallet);

      if(activeWallet.state === CONST.HWW_STATE.READY && activeWallet.publicKey === $scope.ledgerForm.address) {
        // Already selected at backend, do nothing.
      } else {
        if(activeWallet.state === CONST.HWW_STATE.READY) await hardwareWalletDaemon.deselectSubaccount();
        const selectedAddress = await hardwareWalletDaemon.selectSubaccount($scope.ledgerForm.subaccount);
        if(selectedAddress !== address) throw new Error('Addresses mismatch, something bad happened! ' + selectedAddress + '=/=' + address);
      }

      await new Promise((resolve, reject) => AuthenticationFactory.load(AuthenticationFactory.TYPE.TEMPORARY, {address}, (err) => {
          if (err) {
            reject(err)
          } else {
            $location.path('/');
            $rootScope.$apply();
            resolve();
          }
        }));

    } catch(e) {
      $scope.continue = 'Continue';
      $scope.$apply();
      console.error(e)
    }

  }
  /** END: Hardware wallet login **/


  /** START: Communicate with Ledger **/
  const refresh = async (hardwareWalletDaemon) => {
    const bip44 = SettingFactory.getCurrentNetwork().coin.bip44;
    const knownSupportedBip44s = [
      148,  // monoeci.org
      // 5248,  // ficnetwork.com, IN PROGRESS. Please follow https://github.com/LedgerHQ/ledgerjs/pull/171/files.
    ]
    if(!knownSupportedBip44s.includes(bip44)) {
      $scope.ledgerError = { type: 'warning', error: `Ledger doesn't yet support this network's BIP44 (${bip44}).` }
      return;
    }

    const isSupported = await hardwareWalletDaemon.isSupported;
    if(!isSupported) {
      $scope.ledgerError = { type: 'danger', error: 'Your computer doesn\'t support Ledger!' }
      $scope.$apply();
      return;
    }
    const hardwareList = await hardwareWalletDaemon.list;
    if(hardwareList.length != 1) {
      $scope.addressInputDisabled = true;
      if(hardwareList.length < 1) $scope.ledgerError = { type: 'info', error: 'Please connect Ledger.' }
      if(hardwareList.length > 1) $scope.ledgerError = { type: 'warning', error: 'Please connect only one Ledger.' }
      $scope.$apply();
      return;
    }

    const wallet = await hardwareWalletDaemon.activeWallet;
    if(wallet.state !== CONST.HWW_STATE.AVAILABLE && wallet.state !== CONST.HWW_STATE.READY) {
      $scope.addressInputDisabled = true;
      if(wallet.state === CONST.HWW_STATE.OFFLINE) $scope.ledgerError = { type: 'info', error: 'Please unlock Ledger and enter PIN.' }
      if(wallet.state === CONST.HWW_STATE.SLEEP) $scope.ledgerError = { type: 'info', error: 'Please wake Ledger and enter PIN.' }
      if(wallet.state === CONST.HWW_STATE.ONLINE) $scope.ledgerError = { type: 'info', error: 'Please open Ledger app.' }
      $scope.$apply();
      return;
    }
    $scope.addressInputDisabled = true;
    $scope.ledgerError = { type: '', error: '' }
    $scope.$apply();

    refreshAddress($scope.ledgerForm, $scope.ledgerForm);
  }

  hardwareWalletDaemon.listen(refresh);
  refresh(hardwareWalletDaemon);

  /** END: Communicate with Ledger **/

  /** START: Tab bugfix **/
  $('.nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  /** END: Tab bugfix **/

}]);
