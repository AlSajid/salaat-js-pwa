'use client'

import { CalculationMethod, Coordinates, Madhab, PrayerTimes, SunnahTimes } from 'adhan'
import { useCallback, useEffect, useState } from 'react'
import Countdown from 'react-countdown'
import Waqt from './home/waqt'

interface Coords {
	lat: number
	long: number
}

export default function Home() {
	const [location, setLocation] = useState<string | null>(null)
	const [coords, setCoords] = useState<Coords | null>(null)
	const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
	const [date, setDate] = useState(new Date())

	// Load last coordinates from local storage
	useEffect(() => {
		const storedCoords = localStorage.getItem('coords')
		if (storedCoords) setCoords(JSON.parse(storedCoords))
	}, [])

	useEffect(() => {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(({ coords }) => {
				const newCoords = { lat: coords.latitude, long: coords.longitude }
				setCoords(newCoords)
				localStorage.setItem('coords', JSON.stringify(newCoords)) // Save to local storage
			})
		}
	}, [])

	useEffect(() => {
		if (!coords) return

		fetch(
			`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.long}&key=${process.env.NEXT_PUBLIC_API_KEY}&language=bn`
		)
			.then((response) => response.json())
			.then((data) => setLocation(data.results[0]?.formatted_address || 'অবস্থান পাওয়া যায়নি'))
	}, [coords])

	const updatePrayerTimes = useCallback(() => {
		if (!coords) return

		const coordinates = new Coordinates(coords.lat, coords.long)
		const params = CalculationMethod.Karachi()
		const date = new Date()
		setDate(date)

		setPrayerTimes(new PrayerTimes(coordinates, date, params))
	}, [coords])

	useEffect(updatePrayerTimes, [coords, updatePrayerTimes]) // Update prayer times on coords change

	const getPrayer = (): {
		currentWaqt: string
		nextPrayerTime: Date
	} => {
		if (!prayerTimes) return { currentWaqt: '', nextPrayerTime: new Date() }
		const currentPrayer = prayerTimes.currentPrayer(date)

		// if (currentPrayer === 'isha') {
		// 	const sunnahTimes = new SunnahTimes(prayerTimes)
		// 	return sunnahTimes.lastThirdOfTheNight.getTime() < Date.now()
		// 		? sunnahTimes.lastThirdOfTheNight
		// 		: sunnahTimes.middleOfTheNight
		// }

		console.log(currentPrayer)

		if (currentPrayer === 'asr') {
			const maghribTime = prayerTimes.timeForPrayer('maghrib')?.getTime() as number // Get the Maghrib time in milliseconds

			// Check if it is sunset time (5 min) or not
			if (date.getTime() < maghribTime - 5 * 60 * 1000) {
				return {
					currentWaqt: 'asr',
					nextPrayerTime: new Date(maghribTime - 5 * 60 * 1000)
				}
			} else {
				// return new Date(maghribTime) // Return Maghrib time if within last 5 minutes of Asr
				return {
					currentWaqt: 'prohibited',
					nextPrayerTime: new Date(maghribTime)
				}
			}
		}

		const nextPrayerTime = prayerTimes.timeForPrayer(prayerTimes.nextPrayer(date))
		if (nextPrayerTime)
			return {
				currentWaqt: currentPrayer,
				nextPrayerTime
			}
	}

	const prayer = getPrayer()
	// console.log(nextPrayer)

	const prayerNames: Record<string, string> = {
		fajr: 'ফজর',
		sunrise: 'সূর্যোদয়',
		dhuhr: 'যোহর',
		asr: 'আসর',
		maghrib: 'মাগরিব',
		isha: 'ইশা',
		prohibited: 'নিষিদ্ধ সময়'
	}

	const bgColors: Record<string, string> = {
		fajr: 'bg-gradient-to-r from-green-500 to-green-700',
		sunrise: 'bg-gradient-to-r from-red-700 to-red-900',
		dhuhr: 'bg-gradient-to-r from-yellow-700 to-yellow-900',
		asr: 'bg-gradient-to-r from-cyan-700 to-cyan-900',
		maghrib: 'bg-gradient-to-r from-red-700 to-red-900',
		isha: 'bg-gradient-to-r from-gray-700 to-gray-900',
		prohibited: 'bg-gradient-to-r from-red-500 to-gray-900',
		default: 'bg-gradient-to-r from-slate-900 to-slate-700'
	}

	if (!location || !prayerTimes) {
		return (
			<div className="fixed inset-0 bg-gradient-to-r from-cyan-700 to-blue-700 flex justify-center items-center text-white">
				<div className="text-center p-3 animate-pulse">আপনার অবস্থান নির্ণয় করছি...</div>
			</div>
		)
	}

	return (
		<div className={`fixed inset-0 bg-gray-900 text-white ${bgColors[prayer.currentWaqt] || bgColors.default}`}>
			<div className="text-center shadow-2xl p-3">{location}</div>
			<div className="my-10 text-center">
				<h1 className="text-4xl font-black my-3">{prayerNames[prayer.currentWaqt]}</h1>

				<Countdown
					key={prayer.nextPrayerTime.getTime()}
					date={prayer.nextPrayerTime}
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
			<div className="my-7 max-w-sm mx-auto">
				{(Object.keys(prayerNames) as Array<keyof PrayerTimes>).map((waqt) => {
					return (
						<Waqt
							key={waqt}
							name={prayerNames[waqt]}
							time={prayerTimes[waqt]}
						/>
					)
				})}
			</div>
		</div>
	)
}
