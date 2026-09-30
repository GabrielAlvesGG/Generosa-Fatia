import { STORE } from './demo-data';
export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function slotsFor(date: string, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const weekday = new Date(date + 'T12:00:00-03:00').getDay();
  return Array.from(
    { length: Math.floor(((STORE.closingHour - STORE.openingHour) * 60) / STORE.interval) },
    (_, i) => {
      const time =
        String(STORE.openingHour + Math.floor((i * STORE.interval) / 60)).padStart(2, '0') +
        ':' +
        String((i * STORE.interval) % 60).padStart(2, '0');
      const capacity = weekday === STORE.closedWeekday || i % 7 === 3 ? 0 : 3 - (i % 3);
      const past = new Date(date + 'T' + time + ':00-03:00').getTime() <= now;
      return { time, capacity, past, disabled: past || !capacity };
    },
  );
}
export function deliveryAllowed(cep: string, city: string) {
  const digits = cep.replace(/\D/g, '');
  return (
    digits.length === 8 &&
    digits >= STORE.cepMin &&
    digits <= STORE.cepMax &&
    city
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() === 'sao paulo'
  );
}
