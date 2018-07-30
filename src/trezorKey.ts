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
import * as elliptic from 'elliptic';
import { Crypto } from 'ontology-ts-sdk';

import { computesSignature, getPublicKey } from './trezorProxy';

import Address = Crypto.Address;
import CurveLabel = Crypto.CurveLabel;
import JsonKey = Crypto.JsonKey;
import KeyParameters = Crypto.KeyParameters;
import KeyType = Crypto.KeyType;
import PrivateKey = Crypto.PrivateKey;
import PublicKey = Crypto.PublicKey;
import Signable = Crypto.Signable;
import Signature = Crypto.Signature;
import SignatureScheme = Crypto.SignatureScheme;

export interface TrezorKey extends PrivateKey {
    publicKey: PublicKey;   // transient

    index: number;

    type: 'TREZOR';
}

export async function create(index: number): Promise<TrezorKey> {
    const uncompressed = await getPublicKey(index);

    const ec = new elliptic.ec(CurveLabel.SECP256R1.preset);
    const keyPair = ec.keyFromPublic(uncompressed, 'hex');
    const compressed = keyPair.getPublic(true, 'hex');

    return createExisting(index, compressed);
}

export function createExisting(index: number, pKey: string): TrezorKey {
    const privateKey = new PrivateKey('', KeyType.ECDSA, new KeyParameters(CurveLabel.SECP256R1));
    const trezorKey = privateKey as TrezorKey;

    trezorKey.index = index;
    trezorKey.publicKey = new PublicKey(pKey, privateKey.algorithm, privateKey.parameters);
    trezorKey.type = 'TREZOR';

    /**
     * Synchronious signing is not supported with Trezor. Use signAsync instead.
     */
    trezorKey.sign = function sign(msg: string | Signable, schema?: SignatureScheme, publicKeyId?: string): Signature {
        throw new Error('Synchronious signing is not supported with Trezor.');
    };

    /**
     * Signs the data with the Trezor HW.
     *
     * If the signature schema is not provided, the default schema for this key type is used.
     *
     * @param msg Hex encoded input data
     * @param schema Signing schema to use
     * @param publicKeyId Id of public key
     */
    // tslint:disable-next-line:max-line-length
    trezorKey.signAsync = async function signAsync(msg: string | Signable, schema?: SignatureScheme, publicKeyId?: string): Promise<Signature> {
        if (schema === undefined) {
            schema = SignatureScheme.ECDSAwithSHA256;
        }

        if (!this.isSchemaSupported(schema)) {
            throw new Error('Signature schema does not match key type.');
        }

        if (typeof msg === 'string') {
            throw new Error('Signing only message is not supported. Use Signable object instead.');
        }

        const signed = await computesSignature(this.index, msg);

        return new Signature(schema, signed.substr(2), publicKeyId);
    };

    /**
     * Derives Public key out of Private key.
     *
     * Uses cached public key, so no further communication with the Trezor HW is necessary.
     */
    trezorKey.getPublicKey = function getPublicKey2(): PublicKey {
        return this.publicKey;
    };

    /**
     * Only ECDSAwithSHA256 is supported for Trezor key.
     */
    trezorKey.isSchemaSupported = function isSchemaSupported(schema: SignatureScheme): boolean {
        return schema === SignatureScheme.ECDSAwithSHA256;
    };

    /**
     * Gets JSON representation of the Trezor Key.
     */
    trezorKey.serializeJson = function serializeJson(): JsonKey {
        return {
            algorithm: this.algorithm.label,
            external: {
                index: this.index,
                pKey: this.publicKey.key,
                type: 'TREZOR'
            },
            parameters: this.parameters.serializeJson(),
            key: null
        };
    };

    /**
     * Decryption is not supported for Trezor Key. This operation is NOOP.
     */
    trezorKey.decrypt = function decrypt(keyphrase: string, address: Address, salt: string, params?: any): PrivateKey {
        return this;
    };

    /**
     * Encryption is not supported for Trezor Key. This operation is NOOP.
     */
    trezorKey.encrypt = function encrypt(keyphrase: string, address: Address, salt: string, params?: any): PrivateKey {
        return this;
    };

    return trezorKey;
}
