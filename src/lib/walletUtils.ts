import { Wallet, HDNodeWallet } from 'ethers';

export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new Wallet(privateKey);
  return wallet.address;
}

export  function genAccount():HDNodeWallet{
  return Wallet.createRandom();
}