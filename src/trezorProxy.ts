/*
 * Copyright (C) 2018 The ontology Authors
 * This file is part of The ontology library.
 *
 * The ontology is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The ontology is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The ontology.  If not, see <http://www.gnu.org/licenses/>.
 */

// tslint:disable:no-console
// tslint:disable:no-var-requires
import * as Long from 'long';
import { Crypto, Transaction, Transfer, utils } from 'ontology-ts-sdk';
import { timeout } from 'promise-timeout';
import Signable = Crypto.Signable;
import { OntologyPayload, OntologyTransaction, OntologyTxAttribute } from './trezorTypes';

const trezor = require('trezor.js');
const config = require('./trezorConfig.json');

let gDevice: any = null;

const list = new trezor.DeviceList({ debug: false, config: JSON.stringify(config) });
list.on('connect', (dev: any) => gDevice = dev);
list.on('disconnect', (dev: any) => gDevice = null);

/**
 * Detects if Trezor is connected
 *
 */
export async function isTrezorSupported() {
    try {
        await getDeviceWithTimout();
        return true;
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log(e);
        return false;
    }
}

/**
 * Retrieves the public key corresponding to BIP44 index.
 *
 * @param index Index of the public key
 */
export async function getPublicKey(index: number) {
    const device = await getDeviceWithTimout();
    const result = await device.waitForSessionAndRun((session: any) => {
        const path = BIP44(index);

        return session.typedCall(
            'OntologyGetPublicKey',
            'OntologyPublicKey',
            { address_n: path, show_display: false }
        );
    }, { onlyOneActivity: true });

    return result.message.public_key;
}

/**
 * Computes ECDSA signature of the data from Ledger using index.
 *
 * @param index Index of the public key
 * @param signable Signable object
 */
export async function computesSignature(index: number, signable: Signable): Promise<string> {
    const device = await getDeviceWithTimout();
    const result = await device.waitForSessionAndRun((session: any) => {
        const path = BIP44(index);

        if (isTransaction(signable)) {
            const transaction: Transaction = signable as any;
            const trezorTransaction = convertToTrezorTransaction(transaction);

            return session.typedCall(
                'OntologySignTx',
                'OntologySignedTx',
                { address_n: path, transaction: trezorTransaction }
            );
        } else {
            throw new Error('Unsupported Signable implementation. Only Transaction is supported.');
        }

    }, { onlyOneActivity: true });

    return result.message.signature;
}

/**
 * Constructs BIP44 address path from index.
 *
 * @param index Address index
 */
function BIP44(index: number = 0) {
    return [
        0x8000002C,      // purpose
        0x80000378,      // coin type NEO
        0x80000000,      // account
        0x00000000,      // change (external)
        index            // account index
    ];
}

function isTransaction(signable: Signable) {
    const o: any = signable;
    return o.version != null && o.type != null && o.payload != null;
}

function convertToTrezorTransaction(tx: Transaction): OntologyTransaction {
    const transaction: OntologyTransaction = {
        version: tx.version,
        type: tx.type,
        nonce: new utils.StringReader(tx.nonce).readUint32(),
        gasPrice: Long.fromString(tx.gasPrice.value),
        gasLimit: Long.fromString(tx.gasLimit.value),
        payer: tx.payer.toBase58(),
        payload: convertPayload(tx.payload),
        txAttributes: tx.txAttributes.map((att) => convertAttribute(att))
    };

    if (tx instanceof Transfer) {
        transaction.transferInfo = {
            amount: Long.fromValue(tx.amount),
            asset: tx.tokenType === 'ONT' ? 1 : 2,
            fromAddress: tx.from.toBase58(),
            toAddress: tx.to.toBase58()
        };
    }

    return transaction;
}

function convertPayload(payload: any): OntologyPayload {
    if (payload.name != null) {
        // deployCode
        return {
            type: 2,
            code: payload.code,
            needStorage: payload.needStorage,
            name: payload.name,
            version: payload.version,
            author: payload.author,
            email: payload.email,
            description: payload.description
        };
    } else {
        // invokeCode
        return {
            type: 1,
            code: payload.code
        };
    }
}

function convertAttribute(attribute: any): OntologyTxAttribute {
    return {
        usage: attribute.usage,
        data: attribute.data
    };
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDevice() {
    while (gDevice === null) {
        await sleep(5000);
    }
    return gDevice;
}

async function getDeviceWithTimout() {
    return timeout<any>(getDevice(), 5000);
}
