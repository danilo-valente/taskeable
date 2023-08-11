import startOfWeek from "https://deno.land/x/date_fns@v2.22.1/startOfWeek/index.ts";

export const buildWeekId = (date: Date = new Date()) => {
    const base = startOfWeek(date)
    const year = base.getFullYear()
    const month = String(base.getMonth()).padStart(2, '0')
    const day = String(base.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
}