export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getToday = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

export const getMonthName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long" });
};

export const getDateOrdinal = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};

export const getFormattedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = getDateOrdinal(dateString);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}`;
};

export const getPreviousDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  
  return dates;
};