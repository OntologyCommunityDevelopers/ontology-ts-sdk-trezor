import 'babel-polyfill';
import { Crypto, OntAssetTxBuilder, utils } from 'ontology-ts-sdk';
import Address = Crypto.Address;
import CurveLabel = Crypto.CurveLabel;
import KeyType = Crypto.KeyType;
import SignatureScheme = Crypto.SignatureScheme;
import { create } from '../src/trezorKey';

// tslint:disable : no-console
// tslint:disable : max-line-length
describe('test Trezor', () => {

    test.skip('create Trezor key', async () => {
        const key = await create(0);
        const pKey = key.getPublicKey();

        expect(pKey).toBeDefined();
        expect(pKey.key).toBeDefined();
        expect(pKey.algorithm).toBe(KeyType.ECDSA);
        expect(pKey.parameters.curve).toBe(CurveLabel.SECP256R1);

        console.log('pk', pKey.key);
    }, 20000);

    test.skip('create multiple Trezor keys', async () => {
        const key1 = await create(0);
        const pKey1 = key1.getPublicKey();

        const key2 = await create(1);
        const pKey2 = key2.getPublicKey();

        expect(pKey1.key === pKey2.key).toBeFalsy();

        console.log('pk1', pKey1.key);
        console.log('pk2', pKey2.key);
    });

    test('test payload generation', () => {
        const tx = OntAssetTxBuilder.makeTransferTx(
            'ONT',
            new Address('AGn8JFPGM5S4jkWhTC89Xtz1Y76sPz29Rc'),
            new Address('AcyLq3tokVpkMBMLALVMWRdVJ83TTgBUwU'),
            '100',
            '500',
            '30000',
            new Address('AGn8JFPGM5S4jkWhTC89Xtz1Y76sPz29Rc')
        );

        expect((tx.payload as any).code).toBe('00c66b140b045b101bc9fabaf181e251a38e76b73962111b6a7cc814e885e849e7f545ea84e8c555b86c70e4f751c4ec6a7cc80864000000000000006a7cc86c51c1087472616e736665721400000000000000000000000000000000000000010068164f6e746f6c6f67792e4e61746976652e496e766f6b65');
    });

    test('sign with Trezor and verify', async () => {
        const tx = OntAssetTxBuilder.makeTransferTx(
            'ONT',
            new Address('AGn8JFPGM5S4jkWhTC89Xtz1Y76sPz29Rc'),
            new Address('AcyLq3tokVpkMBMLALVMWRdVJ83TTgBUwU'),
            '100',
            '500',
            '30000',
            new Address('AGn8JFPGM5S4jkWhTC89Xtz1Y76sPz29Rc')
        );

        const key = await create(0);
        const pKey = key.getPublicKey();

        const signature = await key.signAsync(tx);
        console.log('signature', signature.serializeHex());

        expect(signature.algorithm).toBe(SignatureScheme.ECDSAwithSHA256);

        const verifyResult = await pKey.verify(tx, signature);
        expect(verifyResult).toBeTruthy();
    }, 20000);

});
