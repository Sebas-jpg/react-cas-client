const fetch = require('node-fetch');

const xml2js = require('xml2js');

const util = require('./util');

const urls = require('./url');

const constant = require('./constant');

let lock = 2;

const defaultOptions = {
  protocol: 'https',
  path: '/cas',
  version: constant.CAS_VERSION_3_0,
  validation_proxy_path: ''
};

class CasClient {
  constructor(endpoint, options = {}) {
    console.log('cas client log');
    if (util.isEmpty(endpoint)) {
      util.throwError('Missing endpoint');
    }
    let version = options.version || defaultOptions.version;
    if (!constant.CAS_VERSIONS.includes(version)) {
      util.throwError('Unsupported CAS Version');
    }
    this.endpoint = endpoint;
    this.path = options.path || defaultOptions.path;
    this.protocol = options.protocol || defaultOptions.protocol;
    this.version = options.version || defaultOptions.version;
    this.validation_proxy_path = options.validation_proxy_path || defaultOptions.validation_proxy_path;
    this.redirectUrl = util.getCurrentUrl();
  }
  
  auth(gateway = false) {
    return new Promise((resolve, reject) => {
      let ticket = util.getParamFromCurrentUrl('ticket');
      console.log('ticket ' + ticket);
      if (util.isEmpty(ticket)) {
        let status = util.getParamFromCurrentUrl('status');
        if (status === constant.CAS_STATUS_IN_PROCESS) {
          console.log(error);
          this._handleFailsValdiate(reject, {            
            type: constant.CAS_ERROR_AUTH_ERROR,
            message: 'Missing ticket from return url'
          });
        } else {
          window.location.href = urls.getLoginUrl(this, gateway);
        }
      } else {
        this._validateTicket(ticket, resolve, reject);
      }
    });
  }

  logout(redirectPath = '') {
    localStorage.clear();
    window.location.href = urls.getLogoutUrl(this, redirectPath);
  }

  _getSuccessResponse(user) {
    return {
      currentUrl: window.location.origin + window.location.pathname,
      currentPath: window.location.pathname,
      user: user
    };
  }

  _validateTicket(ticket, resolve, reject) {
    
    if(lock == 2){
      lock += 1;
      if(sessionStorage.getItem("Validated") === null){
      const url = urls.getValidateUrl(this, ticket);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE) {
            var x = xhr.responseText;
            var hospitalBased = x.indexOf('CAT.WFR.H');
            var isDerm = x.indexOf('SP.WFR.DE');
            var isOnco = x.indexOf('SP.WFR.ON');
            var isHaem = x.indexOf('SD.WFR.21');
            //mutual pharm
            var isPharm1 = x.indexOf('SP.WFR.PM');
            // mining pharm
            var isPharm2 = x.indexOf('SP.WFR.PZ');
            var isPharm3 = x.indexOf('SP.WFR.RM');
            var isPharm4 = x.indexOf('SP.WFR.PH');
            var anyTrue = isDerm += isOnco += isHaem += isPharm1 += isPharm2 += isPharm3 += isPharm4;
            if (hospitalBased !== -1){
              if (anyTrue > 0){
                window.sessionStorage.setItem("Validated", true);
                alert('Validated. ' + '*pop-up to be removed* '+ isDerm + isOnco + isHaem);
              }
              else{
              window.alert('Access denied.');
              window.location.href='/';
              }
            }
            else{
              window.alert('Access denied. Hospital based HCP only.');
              window.location.href='/';
            }
          }
        }
        xhr.open('GET', url, true);
        xhr.send(null);
      }
      else{alert('Validated already. *pop-up to be removed*')}
    }
  }

  _handleSuccessValdiate(callback, user) {
    callback(this._getSuccessResponse(user));
  }

  _handleFailsValdiate(callback, error) {
    error.currentUrl = window.location.origin + window.location.pathname;
    error.currentPath = window.location.pathname;
    callback(error);
  }
  
}


export default CasClient;
export { constant };