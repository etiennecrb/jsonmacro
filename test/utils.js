module.exports = {
  /**
     * Returns the Right Hand Side of a variable assignment.
     * @param t - tape test object
     * @param result - compiled jsonm object
     * @returns {*}
     */
  rhs: (t, result) => {
    try {
      return result[0]['='][1];
    } catch (e) {
      t.notOk("output doesn't have the expected format");
    }
  },

  /** Compiled jsonm keywords */
  TYPE_VAR: 'var',
  TYPE_FUNC: 'func',
  TYPE_PROP: 'prop',
  TYPE_CALL: 'call'
};
