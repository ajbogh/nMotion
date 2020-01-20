import fs, { promises as fsPromise } from 'fs';

export async function getConfig() {
  return fsPromise.readFile('./config.json').then(JSON.parse);
}

export function getConfigSync() {
  const configString = fs.readFileSync('./config.json');
  return JSON.parse(configString);
}

export function getUTCDate (yearUTC, monthUTC, dayUTC) {
  let selectedDate = new Date(0);

  if (yearUTC) {
    selectedDate.setUTCFullYear(parseInt(yearUTC, 10));

    if (monthUTC) {
      // month starts at 0 in JS, we pass 1-based month
      selectedDate.setUTCMonth(parseInt(monthUTC, 10) - 1);

      if (dayUTC) {
        selectedDate.setUTCDate(parseInt(dayUTC, 10));
      }
    }
  }

  return selectedDate;
}
