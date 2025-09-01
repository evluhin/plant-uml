const Resolver = require('@forge/resolver');

const resolver = new Resolver();

resolver.define('run', () => {
  return {
    html: '<div>PlantUML Macro - Use UI Kit 2</div>'
  };
});

module.exports.handler = resolver.getDefinitions();