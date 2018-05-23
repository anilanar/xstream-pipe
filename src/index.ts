import xs, { Stream, Operator, MemoryStream } from 'xstream';

export interface UnaryFunction<T, R> {
    (source: T): R;
}
export interface OperatorFunction<T, R> extends UnaryFunction<Stream<T>, Stream<R>> {}

/**
 * Transforms each event from the input Stream through a `project` function,
 * to get a Stream that emits those transformed events.
 *
 * Marble diagram:
 *
 * ```text
 * --1---3--5-----7------
 *    map(i => i * 10)
 * --10--30-50----70-----
 * ```
 *
 * @param {Function} project A function of type `(t: T) => U` that takes event
 * `t` of type `T` from the input Stream and produces an event of type `U`, to
 * be emitted on the output Stream.
 * @return {OperatorFunction}
 */
export function map<T, U>(project: (value: T) => U): OperatorFunction<T, U> {
    return function(stream) { return stream.map(project); };
}

/**
 * It's like `map`, but transforms each input event to always the same
 * constant value on the output Stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1---3--5-----7-----
 *       mapTo(10)
 * --10--10-10----10----
 * ```
 *
 * @param projectedValue A value to emit on the output Stream whenever the
 * input Stream emits any value.
 * @return {OperatorFunction}
 */
export function mapTo<T, R>(projectedValue: R): OperatorFunction<T, R> {
    return function(stream) { return stream.mapTo(projectedValue); };
}

/**
 * Only allows events that pass the test given by the `passes` argument.
 *
 * Each event from the input stream is given to the `passes` function. If the
 * function returns `true`, the event is forwarded to the output stream,
 * otherwise it is ignored and not forwarded.
 *
 * Marble diagram:
 *
 * ```text
 * --1---2--3-----4-----5---6--7-8--
 *     filter(i => i % 2 === 0)
 * ------2--------4---------6----8--
 * ```
 *
 * @param {Function} passes A function of type `(t: T) => boolean` that takes
 * an event from the input stream and checks if it passes, by returning a
 * boolean.
 * @return {OperatorFunction}
 */
export function filter<T, S extends T>(passes: (t: T) => t is S): OperatorFunction<T, S> {
    return function(stream) { return stream.filter(passes); };
}
/**
 * Lets the first `amount` many events from the input stream pass to the
 * output stream, then makes the output stream complete.
 *
 * Marble diagram:
 *
 * ```text
 * --a---b--c----d---e--
 *    take(3)
 * --a---b--c|
 * ```
 *
 * @param {number} amount How many events to allow from the input stream
 * before completing the output stream.
 * @return {OperatorFunction}
 */
export function take<T>(amount: number): OperatorFunction<T, T> {
    return function(stream) { return stream.take(amount); };
}
/**
 * Ignores the first `amount` many events from the input stream, and then
 * after that starts forwarding events from the input stream to the output
 * stream.
 *
 * Marble diagram:
 *
 * ```text
 * --a---b--c----d---e--
 *       drop(3)
 * --------------d---e--
 * ```
 *
 * @param {number} amount How many events to ignore from the input stream
 * before forwarding all events from the input stream to the output stream.
 * @return {OperatorFunction}
 */
export function drop<T>(amount: number): OperatorFunction<T, T> {
    return function(stream) { return stream.drop(amount); };
}

/**
 * When the input stream completes, the output stream will emit the last event
 * emitted by the input stream, and then will also complete.
 *
 * Marble diagram:
 *
 * ```text
 * --a---b--c--d----|
 *       last()
 * -----------------d|
 * ```
 *
 * @return {OperatorFunction}
 */
export function last<T>(): OperatorFunction<T, T> {
    return function(stream) { return stream.last(); };
}
/**
 * Prepends the given `initial` value to the sequence of events emitted by the
 * input stream. The returned stream is a MemoryStream, which means it is
 * already `remember()`'d.
 *
 * Marble diagram:
 *
 * ```text
 * ---1---2-----3---
 *   startWith(0)
 * 0--1---2-----3---
 * ```
 *
 * @param initial The value or event to prepend.
 * @return {OperatorFunction}
 */
export function startWith<T>(initial: T): UnaryFunction<Stream<T>, MemoryStream<T>> {
    return function(stream) { return stream.startWith(initial); };
}

/**
 * Uses another stream to determine when to complete the current stream.
 *
 * When the given `other` stream emits an event or completes, the output
 * stream will complete. Before that happens, the output stream will behaves
 * like the input stream.
 *
 * Marble diagram:
 *
 * ```text
 * ---1---2-----3--4----5----6---
 *   endWhen( --------a--b--| )
 * ---1---2-----3--4--|
 * ```
 *
 * @param other Some other stream that is used to know when should the output
 * stream of this operator complete.
 * @return {OperatorFunction}
 */
export function endWhen<T>(other: Stream<any>): OperatorFunction<T, T> {
    return function(stream) { return stream.endWhen(other); };
}

/**
 * "Folds" the stream onto itself.
 *
 * Combines events from the past throughout
 * the entire execution of the input stream, allowing you to accumulate them
 * together. It's essentially like `Array.prototype.reduce`. The returned
 * stream is a MemoryStream, which means it is already `remember()`'d.
 *
 * The output stream starts by emitting the `seed` which you give as argument.
 * Then, when an event happens on the input stream, it is combined with that
 * seed value through the `accumulate` function, and the output value is
 * emitted on the output stream. `fold` remembers that output value as `acc`
 * ("accumulator"), and then when a new input event `t` happens, `acc` will be
 * combined with that to produce the new `acc` and so forth.
 *
 * Marble diagram:
 *
 * ```text
 * ------1-----1--2----1----1------
 *   fold((acc, x) => acc + x, 3)
 * 3-----4-----5--7----8----9------
 * ```
 *
 * @param {Function} accumulate A function of type `(acc: R, t: T) => R` that
 * takes the previous accumulated value `acc` and the incoming event from the
 * input stream and produces the new accumulated value.
 * @param seed The initial accumulated value, of type `R`.
 * @return {OperatorFunction}
 */
export function fold<T, R>(accumulate: (acc: R, t: T) => R, seed: R): UnaryFunction<Stream<T>, MemoryStream<R>> {
    return function(stream) { return stream.fold(accumulate, seed); };
}

/**
 * Replaces an error with another stream.
 *
 * When (and if) an error happens on the input stream, instead of forwarding
 * that error to the output stream, *replaceError* will call the `replace`
 * function which returns the stream that the output stream will replicate.
 * And, in case that new stream also emits an error, `replace` will be called
 * again to get another stream to start replicating.
 *
 * Marble diagram:
 *
 * ```text
 * --1---2-----3--4-----X
 *   replaceError( () => --10--| )
 * --1---2-----3--4--------10--|
 * ```
 *
 * @param {Function} replace A function of type `(err) => Stream` that takes
 * the error that occurred on the input stream or on the previous replacement
 * stream and returns a new stream. The output stream will behave like the
 * stream that this function returns.
 * @return {OperatorFunction}
 */
export function replaceError<T>(replace: (err: any) => Stream<T>): OperatorFunction<T, T> {
    return function(stream) { return stream.replaceError(replace); };
}

/**
 * Flattens a "stream of streams", handling only one nested stream at a time
 * (no concurrency).
 *
 * If the input stream is a stream that emits streams, then this operator will
 * return an output stream which is a flat stream: emits regular events. The
 * flattening happens without concurrency. It works like this: when the input
 * stream emits a nested stream, *flatten* will start imitating that nested
 * one. However, as soon as the next nested stream is emitted on the input
 * stream, *flatten* will forget the previous nested one it was imitating, and
 * will start imitating the new nested one.
 *
 * Marble diagram:
 *
 * ```text
 * --+--------+---------------
 *   \        \
 *    \       ----1----2---3--
 *    --a--b----c----d--------
 *           flatten
 * -----a--b------1----2---3--
 * ```
 *
 * @return {OperatorFunction}
 */
export function flatten<T>(): OperatorFunction<Stream<T>, T> {
    return function(stream) { return stream.flatten(); };
}

/**
 * Returns an output stream that behaves like the input stream, but also
 * remembers the most recent event that happens on the input stream, so that a
 * newly added listener will immediately receive that memorised event.
 *
 * @return {OperatorFunction}
 */
export function remember<T>(): UnaryFunction<Stream<T>, MemoryStream<T>> {
    return function(stream) { return stream.remember(); };
}

/**
 * Returns an output stream that identically behaves like the input stream,
 * but also runs a `spy` function for each event, to help you debug your app.
 *
 * *debug* takes a `spy` function as argument, and runs that for each event
 * happening on the input stream. If you don't provide the `spy` argument,
 * then *debug* will just `console.log` each event. This helps you to
 * understand the flow of events through some operator chain.
 *
 * Please note that if the output stream has no listeners, then it will not
 * start, which means `spy` will never run because no actual event happens in
 * that case.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2-----3-----4--
 *         debug
 * --1----2-----3-----4--
 * ```
 *
 * @param {function} labelOrSpy A string to use as the label when printing
 * debug information on the console, or a 'spy' function that takes an event
 * as argument, and does not need to return anything.
 * @return {OperatorFunction}
 */
export function debug<T>(labelOrSpy: string): OperatorFunction<T, T> {
    return function(stream) { return stream.debug(labelOrSpy); };
}

/**
 * Creates an operator that is composed of all given operators.
 *
 * *pipe* is a handy way of creating operators in a chained-style.
 * Instead of writing `stream$.filter(foo).map(bar)` you can write:
 * `stream$.compose(pipe(filter(foo), map(bar))` or
 * `pipe(filter(foo), map(bar))(stream$)`.
 *
 * @param {Array<OperatorFunction>} operators Functions that takes a stream as input and
 * returns a stream as well.
 * @return {OperatorFunction}
 */
/* tslint:disable:max-line-length */
export function pipe<T>(): UnaryFunction<T, T>;
export function pipe<T, A>(op1: UnaryFunction<T, A>): UnaryFunction<T, A>;
export function pipe<T, A, B>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>): UnaryFunction<T, B>;
export function pipe<T, A, B, C>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>): UnaryFunction<T, C>;
export function pipe<T, A, B, C, D>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>): UnaryFunction<T, D>;
export function pipe<T, A, B, C, D, E>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>): UnaryFunction<T, E>;
export function pipe<T, A, B, C, D, E, F>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>): UnaryFunction<T, F>;
export function pipe<T, A, B, C, D, E, F, G>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>): UnaryFunction<T, G>;
export function pipe<T, A, B, C, D, E, F, G, H>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>, op8: UnaryFunction<G, H>): UnaryFunction<T, H>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(op1: UnaryFunction<T, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>, op8: UnaryFunction<G, H>, op9: UnaryFunction<H, I>): UnaryFunction<T, I>;
/* tslint:enable:max-line-length */

export function pipe<T, R>(...operators: any[]): UnaryFunction<T, R> {
    if (operators.length === 1) {
        return operators[0];
    }
    return function(input: T): R {
        return operators.reduce(function(prev: any, fn) { return fn(prev); }, input);
    };
}
