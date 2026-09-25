/** ברכה בעברית לפי שעת היום. מקבלת Date כפרמטר כדי להישאר פונקציה טהורה - קריאת השעון עצמה נשארת אצל הקורא (בתוך useEffect בקומפוננטת client). */
export function getTimeBasedGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 21) return "ערב טוב";
  return "לילה טוב";
}
