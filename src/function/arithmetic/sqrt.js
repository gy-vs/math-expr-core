import { factory } from '../../utils/factory.js'

const name = 'sqrt'
const dependencies = ['config', 'typed', 'Complex', 'Fraction']

export const createSqrt = /* #__PURE__ */ factory(name, dependencies, ({ config, typed, Complex, Fraction }) => {
  /**
   * Calculate the square root of a value.
   *
   * For matrices, if you want the matrix square root of a square matrix,
   * use the `sqrtm` function. If you wish to apply `sqrt` elementwise to
   * a matrix M, use `math.map(M, math.sqrt)`.
   *
   * Syntax:
   *
   *    math.sqrt(x)
   *
   * Examples:
   *
   *    math.sqrt(25)                // returns 5
   *    math.square(5)               // returns 25
   *    math.sqrt(-4)                // returns Complex 2i
   *
   * See also:
   *
   *    square, multiply, cube, cbrt, sqrtm
   *
   * @param {number | BigNumber | Complex | Unit} x
   *            Value for which to calculate the square root.
   * @return {number | BigNumber | Complex | Unit}
   *            Returns the square root of `x`
   */
  return typed('sqrt', {
    number: _sqrtNumber,

    Complex: function (x) {
      return x.sqrt()
    },

    BigNumber: function (x) {
      if (!x.isNegative() || config.predictable) {
        return x.sqrt()
      } else {
        // negative value -> downgrade to number to do complex value computation
        return _sqrtNumber(x.toNumber())
      }
    },

    Fraction: function (x) {
      // Fractions do not support an irrational square root, but the root of
      // a perfect square fraction is rational and can be returned exactly.
      const sqrt = _fractionSqrt(x)
      if (sqrt) {
        return sqrt
      }

      if (config.predictable) {
        throw new Error('Result of sqrt is non-rational and cannot be expressed as a fraction')
      } else {
        return _sqrtNumber(x.valueOf())
      }
    },

    Unit: function (x) {
      // Someday will work for complex units when they are implemented
      if (x.value?.isFraction) {
        // keep the value a Fraction when the root is rational
        return x.pow(new Fraction(1, 2))
      }
      return x.pow(0.5)
    }

  })

  /**
   * Calculate the square root of a Fraction when it is a perfect square,
   * otherwise return null.
   * @param {Fraction} x
   * @returns {Fraction | null}
   * @private
   */
  function _fractionSqrt (x) {
    if (x.s < 0) {
      return null
    }
    const sqrtN = integerSqrt(x.n)
    const sqrtD = integerSqrt(x.d)
    if (sqrtN * sqrtN === x.n && sqrtD * sqrtD === x.d) {
      return new Fraction(sqrtN, sqrtD)
    }
    return null
  }

  /**
   * Calculate the integer square root of a non-negative integer,
   * accepting either a number or a bigint.
   * @param {number | bigint} n
   * @returns {number | bigint}
   * @private
   */
  function integerSqrt (n) {
    if (typeof n === 'bigint') {
      if (n <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return BigInt(Math.floor(Math.sqrt(Number(n))))
      }
      // Newton's method for large bigints
      let x = n
      let y = (x + 1n) / 2n
      while (y < x) {
        x = y
        y = (x + n / x) / 2n
      }
      return x
    }
    return Math.floor(Math.sqrt(n))
  }

  /**
   * Calculate sqrt for a number
   * @param {number} x
   * @returns {number | Complex} Returns the square root of x
   * @private
   */
  function _sqrtNumber (x) {
    if (isNaN(x)) {
      return NaN
    } else if (x >= 0 || config.predictable) {
      return Math.sqrt(x)
    } else {
      return new Complex(x, 0).sqrt()
    }
  }
})
