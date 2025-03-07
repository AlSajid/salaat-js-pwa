'use client';

import { CalculationMethod, Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { useCallback, useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import Waqt from './home/waqt';

interface Coords {
   lat: number;
   long: number;
}

// interface PrayerTimesState extends PrayerTimes {}

export default function Home() {
   const [location, setLocation] = useState<string | null>(null);
   const [coords, setCoords] = useState<Coords | null>(null);
   const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);

   useEffect(() => {
      const storedCoords = localStorage.getItem('coords');
      if (storedCoords) setCoords(JSON.parse(storedCoords));
   }, []);

   useEffect(() => {
      if ('geolocation' in navigator) {
         navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
               const newCoords = { lat: coords.latitude, long: coords.longitude };
               setCoords(newCoords);
               localStorage.setItem('coords', JSON.stringify(newCoords));
            },
            () => alert('Geolocation is not available')
         );
      }
   }, []);

   useEffect(() => {
      if (!coords) return;
      fetch(
         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.long}&key=AIzaSyBPaYvFthsrjakGqjnEQo6DjGItafowF3I&language=bn`
      )
         .then((response) => response.json())
         .then((data) => setLocation(data.results[0]?.formatted_address || 'অবস্থান পাওয়া যায়নি'));
   }, [coords]);

   const updatePrayerTimes = useCallback(() => {
      if (!coords) return;
      const coordinates = new Coordinates(coords.lat, coords.long);
      const params = CalculationMethod.Karachi();

      const date = new Date();
      date.setHours(0, 0, 0, 0);
      console.log(date);

      setPrayerTimes(new PrayerTimes(coordinates, date, params));
   }, [coords]);

   useEffect(updatePrayerTimes, [coords]);

   const getNextPrayer = (): Date | null => {
      if (!prayerTimes) return null;
      const nextPrayerTime = prayerTimes.timeForPrayer(prayerTimes.nextPrayer());

      if (nextPrayerTime) return nextPrayerTime;
      if (prayerTimes.currentPrayer() === 'isha') {
         const sunnahTimes = new SunnahTimes(prayerTimes);
         return sunnahTimes.lastThirdOfTheNight.getTime() < Date.now()
            ? sunnahTimes.lastThirdOfTheNight
            : sunnahTimes.middleOfTheNight;
      }
      return null;
   };

   const prayerNames: Record<string, string> = {
      fajr: 'ফজর',
      sunrise: 'সূর্যোদয়',
      dhuhr: 'যোহর',
      asr: 'আসর',
      maghrib: 'মাগরিব',
      isha: 'ইশা',
      none: 'সেহরি',
   };

   const bgColors: Record<string, string> = {
      fajr: 'bg-gradient-to-r from-green-500 to-green-700',
      sunrise: 'bg-gradient-to-r from-red-700 to-red-900',
      dhuhr: 'bg-gradient-to-r from-yellow-700 to-yellow-900',
      asr: 'bg-gradient-to-r from-cyan-700 to-cyan-900',
      maghrib: 'bg-gradient-to-r from-red-700 to-red-900',
      isha: 'bg-gradient-to-r from-gray-700 to-gray-900',
      default: 'bg-gradient-to-r from-slate-900 to-slate-700',
   };

   if (!location || !prayerTimes) {
      return (
         <div className="fixed inset-0 bg-gradient-to-r from-cyan-700 to-blue-700 flex justify-center items-center text-white">
            <div className="text-center p-3 animate-pulse">আপনার অবস্থান নির্ণয় করছি...</div>
         </div>
      );
   }

   return (
      <div
         className={`fixed inset-0 bg-gray-900 text-white ${bgColors[prayerTimes.currentPrayer()] || bgColors.default}`}
      >
         <div className="text-center shadow-2xl p-3">{location}</div>
         <div className="my-10 text-center">
            {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
            <h1 className="text-4xl font-black my-3">{prayerNames[prayerTimes.currentPrayer()]}</h1>
            <Countdown
               date={getNextPrayer()}
               onComplete={updatePrayerTimes}
               renderer={({ hours, minutes, seconds }) => (
                  <div className="flex justify-center items-center text-xl font-bold flex-col">
                     {hours > 0 && <p>{hours.toLocaleString('bn')} ঘন্টা</p>}
                     {minutes > 0 && <p>{minutes.toLocaleString('bn')} মিনিট</p>}
                     <p>{seconds.toLocaleString('bn')} সেকেন্ড</p>
                  </div>
               )}
            />
         </div>
         <div className="my-7">
            {Object.keys(prayerNames).map((waqt) => (
               <Waqt key={waqt} name={prayerNames[waqt]} time={prayerTimes[waqt as keyof PrayerTimesd]} />
            ))}
         </div>
      </div>
   );
}
