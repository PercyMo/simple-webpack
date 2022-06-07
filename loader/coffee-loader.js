const coffeescript = require('coffeescript');

function loader(source) {
  return coffeescript.compile(source);;
}

module.exports = loader;
