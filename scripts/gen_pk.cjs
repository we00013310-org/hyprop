const { HDNodeWallet } = require("ethers");

const COUNT = 5;

function main() {
  for (let i = 0; i < COUNT; i++) {
    const wallet = HDNodeWallet.createRandom();

    console.log(`[${i + 1}]`, wallet.address, wallet.privateKey);
  }
}

main();
