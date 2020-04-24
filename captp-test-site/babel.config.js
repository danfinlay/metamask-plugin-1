// Enable tildot (~.) parsing.
const { parse } = require('@agoric/babel-parser');

module.exports = {
  plugins: [{
    parserOverride(code, opts) {
      const { plugins = [] } = opts;
      plugins.push("eventualSend");
      return parse(code, { ...opts, plugins });
    },
  }]
};
