const fs = require('fs');
const { parseXmlString } = require('libxmljs');
const path = require('path');
const Registry = require('winreg');
const { log, util } = require('vortex-api');

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKCU,
    key: '\\Software\\Wargaming.net\\Launcher\\Apps\\wot',
  });

  return new Promise((resolve, reject) => {
    regKey.values((err, result) => {
      if (err !== null) {
        return reject(err);
      }
      if (result.length === 0) {
        return resolve(null);
      }
      // the keys seem to be a hash or something, but even
      // on a vanilla installation there are two entries, both
      // with the same value (though different capitalization)
      resolve(result[0].value);
    });
  });
}

let version;

function queryModPath(gamePath) {
  if (version === undefined) {
    try {
      const data = fs.readFileSync(path.join(gamePath, 'version.xml'), { encoding: 'utf8' });
      const versionXML = parseXmlString(data);

      version = versionXML.get('//version.xml/version').text();
      version = version.replace(/ ?v.([0-9.]*) .*/, '$1');
      fs.statSync(path.join(gamePath, 'res_mods', version));
    } catch (parseErr) {
      version = undefined;
      throw new util.SetupError('World of Tanks doesn\'t seem to be installed correctly. '
        + 'Please check the version.xml file in your game directory.');
    }
  }

  return path.join(gamePath, 'res_mods', version);
}

function main(context) {
  context.registerGame({
    id: 'worldoftanks',
    name: 'World Of Tanks',
    mergeMods: true,
    queryPath: findGame,
    queryModPath,
    logo: 'gameart.png',
    executable: () => 'WorldOfTanks.exe',
    requiredFiles: [
      'WorldOfTanks.exe',
      'version.xml'
    ],
    details: {
    },
  });

  return true;
}

module.exports = {
  default: main,
};
