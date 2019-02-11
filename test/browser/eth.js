import snet from '../../build/snet.js';
console.log(snet);

let web3;

describe("Eth", function() {
    var a;
    it("should return a valid block number", async function() {
        const snetInstance = snet.create(web3);
        const blockNumber = await snetInstance.eth.getBlockNumber();
        console.log(blockNumber);

        expect(blockNumber).toBeGreaterThan(100);
    });
  });
        