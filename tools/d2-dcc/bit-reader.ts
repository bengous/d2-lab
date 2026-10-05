/**
 * Part of the DCC decoder ported from OpenDiablo2 `d2common/d2fileformats/d2dcc` at
 * 7f92c571bf04057a7fbdfb5d25a486f7d775e3c3, under GPL-3.0 like its source.
 *
 * @module
 */

/** Reads bits from the lowest of each byte, as `d2datautils.BitMuncher`. */
export class BitReader {
  bitsRead = 0;
  readonly #bytes: Uint8Array;
  #offset: number;

  constructor(bytes: Uint8Array, offset: number) {
    this.#bytes = bytes;
    this.#offset = offset;
  }

  copy(): BitReader {
    return new BitReader(this.#bytes, this.#offset);
  }

  bit(): number {
    const value = (this.#bytes[this.#offset >> 3]! >> (this.#offset & 7)) & 1;

    this.#offset++;
    this.bitsRead++;

    return value;
  }

  bits(count: number): number {
    let value = 0;

    for (let index = 0; index < count; index++) {
      value += this.bit() * 2 ** index;
    }

    return value;
  }

  signed(count: number): number {
    const value = this.bits(count);

    if (count === 0) {
      return 0;
    }

    if (count === 1) {
      return -value;
    }

    return value >= 2 ** (count - 1) ? value - 2 ** count : value;
  }

  skip(count: number): void {
    this.#offset += count;
    this.bitsRead += count;
  }
}
