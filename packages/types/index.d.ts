declare type NonObject = undefined | null | boolean | string | number | Function

/**
 * This type allows you to mark an object with
 * optional properties as required.
 */
export declare type Complete<T> = {
    [K in keyof T]-?: T[K]
}

/**
 * This type allows you to mark an object with
 * optional properties as required recursively.
 */
export declare type DeepComplete<T> =  T extends NonObject
    ? T extends undefined ? never : T
    : T extends Array<infer U>
    ? DeepCompleteArray<U>
    : T extends Map<infer K, infer V>
    ? DeepCompleteMap<K, V>
    : DeepCompleteObject<T>


interface DeepCompleteArray<T> extends ReadonlyArray<DeepComplete<T>> { }
interface DeepCompleteMap<K, V> extends ReadonlyMap<DeepComplete<K>, DeepComplete<V>> { }

declare type DeepCompleteObject<T> = {
    [K in keyof T]-?: DeepComplete<T[K]>
}
