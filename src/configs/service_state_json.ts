const SERVICE_STATE_JSON = {
    "nested": {
      "escrow": {
        "nested": {
          "PaymentChannelStateService": {
            "methods": {
              "GetChannelState": {
                "requestType": "ChannelStateRequest",
                "responseType": "ChannelStateReply"
              }
            }
          },
          "ChannelStateRequest": {
            "fields": {
              "channelId": {
                "type": "bytes",
                "id": 1
              },
              "signature": {
                "type": "bytes",
                "id": 2
              }
            }
          },
          "ChannelStateReply": {
            "fields": {
              "currentNonce": {
                "type": "bytes",
                "id": 1
              },
              "currentSignedAmount": {
                "type": "bytes",
                "id": 2
              },
              "currentSignature": {
                "type": "bytes",
                "id": 3
              }
            }
          }
        }
      }
    }
  }


const PACKAGENAME = 'escrow';
const SERVICENAME = 'PaymentChannelStateService';
const GET_CHANNEL_STATE = 'GetChannelState';
const FULLSERVICENAME = PACKAGENAME + '.' + SERVICENAME;

export {SERVICE_STATE_JSON, PACKAGENAME, SERVICENAME, GET_CHANNEL_STATE, FULLSERVICENAME}