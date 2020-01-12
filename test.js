const NodeRSA = require('node-rsa');
const _sodium = require('libsodium-wrappers');


(async() => {
    await _sodium.ready;
    const sodium = _sodium;

    console.log('ASYMMETRIC CRYPTOGRAPHY');

    m = 'Hello 123'; // messages are strings
    console.log('Message', m, sodium.to_base64(m)); // look at base64 encodings

    m_encoded = sodium.to_base64(m); // always use base64 encoded messages to encrypt
    
    key = new NodeRSA ({b: 512});

    c = key.encrypt(m_encoded); // always encrypt encoded messages
    console.log('Encrypted ciphertext', c);

    m_decrypted = key.decrypt(c); // returns Buffer object
   
    m_orig = Buffer.from(sodium.from_base64(m_decrypted)).toString(); // get original message as follows
    console.log('Decrypted', m_orig);
    
    console.log('SYMMETRIC CRYPTOGRAPHY'); 

    sym_key = sodium.crypto_secretbox_keygen(); // generate symmetric key

    nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES); // new nonce for each encryption
    c_sym = sodium.crypto_secretbox_easy(m_encoded, nonce, sym_key);

    console.log('Encrypted ciphertext', c_sym);

    m_sym_decrypted = sodium.crypto_secretbox_open_easy(c_sym, nonce, sym_key); // need same nonce and key for decryption

    // look at lines 498 and 491 from nate's code, see how in line 495 he uses uintConcat to keep them together

    m_sym_orig = Buffer.from(sodium.from_base64(m_sym_decrypted)).toString(); // sometimes we need to maintain the Buffer format, better to return in 
                                                                              // m_sym_decrypted format, and work with Buffer.from or whatever needed later

    console.log('Decrypted', m_sym_orig);
    
})();

