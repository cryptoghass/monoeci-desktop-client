/* global myApp */

myApp.factory('MonoeciGuard', ['SettingFactory', '$http',
                      function( SettingFactory ,  $http ) {
  const STELLARGUARD_PUBLIC_KEY = 'GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD';

  return {
    hasMonoeciGuard(account) {
      return account.signers.some(function(signer) {
        return signer.public_key === STELLARGUARD_PUBLIC_KEY;
      });
    },

    submitTransaction(transaction) {
      const url = this._getUrl('transactions');
      const xdr = transaction.toEnvelope().toXDR('base64');
      return $http.post(url, {xdr: xdr})
        .then(function(res) {
          console.log(res);
          return res.data;
        });
    },

    _getUrl(path) {
      let host = 'monoeciguard.me';
      if(SettingFactory.getNetworkType() !== 'xlm') {
        host = 'test.monoeciguard.me';
      }

      return `https://${host}/api/${path}`;
    }
  };
} ]);
