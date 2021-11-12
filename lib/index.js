const fetch = require('node-fetch');

const xml2js = require('xml2js');

const util = require('react-cas-client/lib/util');

const urls = require('react-cas-client/lib/url');

const constant = require('react-cas-client/lib/constant');
console.log('test2');
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
    console.log('1');
    return new Promise((resolve, reject) => {
      /**
       * Save ticket to sessionStorage if exists
       */
      let ticket = util.getParamFromCurrentUrl('ticket');

      console.log('ticket: ' + ticket);

      if (util.isEmpty(ticket)) {
        let status = util.getParamFromCurrentUrl('status');

        if (status === constant.CAS_STATUS_IN_PROCESS) {
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
    window.location.href = urls.getLogoutUrl(this, redirectPath);
    console.log('123');
  }

  _getSuccessResponse(user) {
    console.log(user);
    console.log('user');
    return {
      currentUrl: window.location.origin + window.location.pathname,
      currentPath: window.location.pathname,
      user: user
    };
  }

  _validateTicket(ticket, resolve, reject) {
    let version = this.version;
    let content_type;
    console.log(version);
    console.log(content_type);

    switch (version) {
      case constant.CAS_VERSION_2_0:
        content_type = 'text/xml';
        console.log('123');
        break;

      case constant.CAS_VERSION_3_0:
        content_type = 'application/json';
        console.log('123');
        break;

      default:
        throw util.throwError('Unsupported CAS Version');
    }
    console.log(this);
    console.log(urls);
    console.log(user);

    fetch(urls.getValidateUrl(this, ticket), {
      headers: {
        'Content-Type': content_type
      }
      
    }).then(function (response) {
      console.log('response');
      response.text().then(function (text) {
        console.log('response');
        switch (version) {
          case constant.CAS_VERSION_2_0:
            console.log('response');
            xml2js.parseStringPromise(text).then(function (result) {
              console.log('------')
              let response = result['cas:serviceResponse'];
              console.log('test');

              if (response['cas:authenticationSuccess']) {
                console.log('response');

                let successes = response['cas:authenticationSuccess'];
                console.log('------')

                if (successes.length) {
                  console.log('response');
                  let user = successes[0]['cas:user'][0];
                  console.log('------')
                  console.log(user);
                  this._handleSuccessValdiate(resolve, user);

                  console.log('urlparams');
                  // const urlParams = new URLSearchParams(window.location.search);
                  // const service = queryParams.get('service');
                  // const ticket = urlParams.get('ticket');
                  console.log('ticket' + ticket);

//                   var xhttp = new XMLHttpRequest();
//                   xhttp.onreadystatechange = function() {
//                     if (this.readyState == 4 && this.status == 200) {
//                         console.log(this.response);
//                       xmlRead(this);
//                     }
//                     else{
//                       console.log(this.response);
//                     }
//                   };
              
//                   xhttp.open("GET", "https://www.rowa-secure.com/sso/serviceValidate?service=https%3A%2F%2Ffrenchpoteligeo-staging.azurewebsites.net%2Fpoteligeo&ticket=" + ticket, true);
//                                   //    https://www.rowa-secure.com/sso/serviceValidate?service=https%3A%2F%2Ffrenchpoteligeo-staging.azurewebsites.net%2Fpoteligeo&ticket=ST-2927-C2ucqxxxVGEFkfBinjgC-www.rowa-secure.com
              
//                   xhttp.send();
//                   console.log(xhttp);
//                   xmlRead(xhttp);
                }
              } else {
                let failures = response['cas:authenticationFailure'];
                console.log('auth fail');

                if (failures.length) {
                  console.log('123');
                  this._handleFailsValdiate(reject, {
                    type: constant.CAS_ERROR_AUTH_ERROR,
                    code: failures[0].$.code.trim(),
                    message: failures[0]._.trim()
                  });
                  console.log('123');
                }
                console.log('123');
              }
              console.log('123');
            }.bind(this)).catch(function (error) {
              console.log('123');
              this._handleFailsValdiate(reject, {
                type: constant.CAS_ERROR_PARSE_RESPONSE,
                message: 'Failed to parse response',
                exception: error
              });
              console.log('123');
            }.bind(this));
            console.log('123');
            break;

          case constant.CAS_VERSION_3_0:
            try {
              let json = JSON.parse(text);

              if (json.serviceResponse) {
                  console.log('3');
                if (json.serviceResponse.authenticationSuccess) {
                  let user = json.serviceResponse.authenticationSuccess.user;
                  console.log('4');
                  this._handleSuccessValdiate(resolve, user);
                } else {
                  this._handleFailsValdiate(reject, {
                    type: constant.CAS_ERROR_AUTH_ERROR,
                    code: json.serviceResponse.authenticationFailure.code,
                    message: json.serviceResponse.authenticationFailure.description
                  });
                }
              }
            } catch (error) {
              this._handleFailsValdiate(reject, {
                type: constant.CAS_ERROR_PARSE_RESPONSE,
                message: 'Failed to parse response',
                exception: error
              });
              console.log('123');
            }
            console.log(this);
            break;

          default:
            throw util.throwError('Unsupported CAS Version');
        }
      }.bind(this)).catch(function (error) {
        this._handleFailsValdiate(reject, {
          type: constant.CAS_ERROR_PARSE_RESPONSE,
          message: 'Failed to parse response',
          exception: error
        });
        console.log('123');
      }.bind(this));
    }.bind(this)).catch(function (error) {
      console.log('------');
      this._handleFailsValdiate(reject, {
        type: constant.CAS_ERROR_FETCH,
        message: 'Failed to connect CAS server',
        exception: error
      });
    }.bind(this));
  }
  

  _handleSuccessValdiate(callback, user) {
    console.log('------')
    console.log('response');
    console.log(callback);
    console.log(user);
    callback(this._getSuccessResponse(user));
  }

  _handleFailsValdiate(callback, error) {
    console.log('------')
    error.currentUrl = window.location.origin + window.location.pathname;
    error.currentPath = window.location.pathname;
    console.log('response');
    callback(error);
  }

}

// function xmlRead(xml) {
//   var x, i, xmlDoc, txt;
//   xmlDoc = xml.responseXML;
//   txt = "";
//   console.log('function xmlRead')
//   console.log(xmlDoc);

// }

// if(response){
// console.log(response);
// }

export default CasClient;
export { constant };
