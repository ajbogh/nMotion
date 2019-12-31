import fs, { promises as fsPromise } from 'fs';

export async function getConfig() {
  return fsPromise.readFile('./config.json').then(JSON.parse);
}

export function getConfigSync() {
  const configString = fs.readFileSync('./config.json');
  return JSON.parse(configString);
}
