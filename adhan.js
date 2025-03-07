import adhan, { SunnahTimes } from 'adhan';
import moment from 'moment';

const { Coordinates, CalculationMethod, PrayerTimes } = adhan;

// console.log('Adhan', adhan);

const coordinates = new Coordinates(23.91111, 90.390156);

const params = CalculationMethod.Karachi();

for (let i = 0; i < 35; i++) {
   const date = new Date(2025, 12, i);

   // Compute prayer times
   const prayerTimes = new PrayerTimes(coordinates, date, params);
   const sunnahTimes = new SunnahTimes(prayerTimes);
   console.log('Prayer Times', moment(sunnahTimes.middleOfTheNight).format('h:mm'));
}

// Format times correctly, ensuring they are valid
// console.log('Fajr', moment(prayerTimes.fajr).format('H:mm:ss'));
// console.log('sunset', moment(prayerTimes.maghrib).format('h:mm:ss'));
