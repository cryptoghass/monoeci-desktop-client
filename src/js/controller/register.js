/* global myApp, require, StellarSdk, zxcvbn */

myApp.controller('RegisterCtrl', ['$scope', '$location', 'AuthenticationFactory',
                         function( $scope ,  $location ,  AuthenticationFactory ) {
    $scope.password = '';
    $scope.passwordSet = {};
    $scope.password1 = '';
    $scope.password2 = '';
    $scope.key = '';
    $scope.mode = 'register_new_account'; // register_new_account
    $scope.showMasterKeyInput = false;
    $scope.submitLoading = false;
    $scope.weakPassword = true;

    // Password strength
    var passwordStrength = {
      0: "Worst",
      1: "Bad",
      2: "Weak",
      3: "Good",
      4: "Strong"
    }

    // Password strength meter
    var meter = document.getElementById('password-strength-meter');
    var text = document.getElementById('password-strength-text');


    //Watch for password changes
    $scope.$watch('password1', (newValue) => {
      if(newValue == undefined) { newValue = ''; }
      let result = zxcvbn(newValue);
      meter.value = result.score;
      if (newValue !== "") {
        text.innerHTML = "Password strength: " + passwordStrength[result.score];
      } else {
        text.innerHTML = "Password strength: -";
      }
      if(result.score >= 2) {
        $scope.weakPassword = false;
      } else {
        $scope.weakPassword = true;
      }
    }, true);


    $scope.changeMode = (mode) => {
      $scope.mode = mode;
    };
    $scope.showPass = (flag) => {
      $scope.showPassword = flag;
    };
    $scope.showSec = (flag) => {
      $scope.showSecret = flag;
    };

    $scope.reset = () => {
      $scope.address = '';
      $scope.password = '';
      $scope.password1 = '';
      $scope.password2 = '';
      $scope.secret = '';
      $scope.key = '';
      $scope.mode = 'register_new_account';
      $scope.showMasterKeyInput = false;
      $scope.submitLoading = false;
      $scope.weakPassword = true;

      if ($scope.registerForm) $scope.registerForm.$setPristine(true);
    };

    const getWalletFilename = (secret, timestamp) => {
      const address = StellarSdk.Keypair.fromSecret(secret).publicKey()
      var ts = timestamp ? new Date(timestamp) : new Date()

      return [
        'wallet',
        '--',
        address.toString('hex'),
        '--',
        'UTC--',
        ts.toJSON().replace(/:/g, '-').slice(0, -5),
        '.keystore'
      ].join('')
    }

    $scope.fileInputClick = () => {
      if(!$scope.secret) $scope.secret = StellarSdk.Keypair.random().secret();
      const remote = require('electron').remote;
      var dialog = remote.dialog;

      dialog.showSaveDialog({
          properties: [ 'openFile' ],
          defaultPath: getWalletFilename($scope.secret),
        }, (filename) => {
          $scope.$apply(() => {
            $scope.walletfile = filename;
            if($scope.walletfile != '' && $scope.walletfile != undefined) {
              $scope.mode = 'register_empty_wallet';
            } else {
              $scope.mode = 'register_new_account';
            }
            $scope.save_error = '';
          });
        }
      );
    };

    $scope.submitForm = async () => {
      if(!$scope.secret) $scope.secret = StellarSdk.Keypair.random().secret();

      const options = {
        address: StellarSdk.Keypair.fromSecret($scope.secret).publicKey(),  // ignored until blob format v2.
        secrets: [$scope.secret],  // TODO: blob format v2 to handle multiple secrets (and other things in upcoming commits).
        password: $scope.password1,
        path: $scope.walletfile
      };
      try {
        await AuthenticationFactory.create(AuthenticationFactory.TYPE.FILESYSTEM, options);
        $scope.password = new Array($scope.password1.length+1).join("*");
        $scope.address = options.address;
        $scope.key = `S${new Array(56).join("*")}`;
        $scope.mode = 'welcome';
      } catch(err) {
        console.error('Registration failed!', err);
        $scope.save_error = err.message;
      } finally {
        $scope.$apply();
      }
    };

    $scope.submitSecretKeyForm = () => {
      $scope.secret = $scope.secretKey;
      $scope.fileInputClick();
    };

    $scope.gotoFund = () => {
      $scope.mode = 'register_empty_wallet';
      $scope.reset();

      $location.path('/');
    };

  }
]);
