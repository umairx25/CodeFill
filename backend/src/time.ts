interface DayDate {
    days: number;
    hours: number;
    minutes: number;
}

function getTimeDifference(dateStr: string): DayDate {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = now - then;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
}

function formatDates(time: DayDate) {

    if (time.minutes < 1) {
        console.log("Code received now");
    } else if (time.days >= 1) {
        console.log(`Code received ${time.days} day(s) ago`);
    } else if (time.hours >= 1) {
        console.log(`Code received ${time.hours} hour(s) ago`);
    } else {
        console.log(`Code received ${time.minutes} minute(s) ago`);
    }
}

// function populate_ui() {
//   const isSignedIn = false;

//   if (!isSignedIn) {
//     console.log("Please sign in");
//     return;
//   }

//   formatDates();
// }

// Testing

const values = [
  "Fri, 13 Jun 2025 02:50:00 EST",  // now
  "Fri, 13 Jun 2025 02:49:00 EST",  // 1 minute ago
  "Fri, 13 Jun 2025 02:46:00 EST",  // 4 minutes ago
  "Fri, 13 Jun 2025 01:50:00 EST",  // 1 hour ago
  "Fri, 13 Jun 2025 00:20:00 EST",  // 2.5 hours ago
  "Thu, 12 Jun 2025 02:51:00 EST",  // ~24 hours ago
  "Thu, 12 Jun 2025 02:50:00 EST",  // 1 day ago
  "Wed, 11 Jun 2025 02:50:00 EST",  // 2 days ago
  "Sun, 08 Jun 2025 20:50:00 EST",  // 5 days, 6 hours ago
  "Fri, 13 Jun 2025 02:40:00 EST"   // 10 minutes ago
]



for (const value of values){
    const result = getTimeDifference(value);
    formatDates(result)
}


