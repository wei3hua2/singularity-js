/**
 * @module channel
 */

import { ChannelState, Channel } from '../models/channel';

class ChannelStateSvc extends ChannelState {
    constructor(web3:any, endpoint:string, channel:Channel){
        super(web3, endpoint, channel);
    }
}

export {ChannelStateSvc}