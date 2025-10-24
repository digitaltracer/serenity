"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPersistenceClient = setPersistenceClient;
exports.getPersistenceClient = getPersistenceClient;
let persistenceClientSingleton = null;
function setPersistenceClient(client) {
    persistenceClientSingleton = client;
}
function getPersistenceClient() {
    if (!persistenceClientSingleton) {
        throw new Error('PersistenceClient not set. Call setPersistenceClient() at app startup.');
    }
    return persistenceClientSingleton;
}
