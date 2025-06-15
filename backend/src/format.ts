/**
 * This file contains the logic for extracting verification codes, and formatting results
 * for the express server
 */


import { Email, authorize, getEmails, signOut, DayDate } from "./main";


/**
 * This function uses regex matching to detect whether a given email contains a
 * valid verification code. It also performs checks on other aspects of the email,
 * such as the subject, to determine whether the email is relevant
 */
async function getCode(emails: Email[]) {
  var all_codes = [];
  try {
    // const auth = await authorize();
    // const emails = await getEmails(auth);  //TODO: dont call this all the time

    for (const email of emails) {
      const regex = /\b[A-Z0-9]{5,15}\b/g;
      const formattedTime = formatDates(getTimeDifference(email.Time));
      email.Time = formattedTime

      var verif_codes = email.Body.match(regex);

      if (verif_codes !== null && check_subject(email.Subject)) {
        var final_code = removeURL(email, verif_codes);

        if (final_code === null) {
          email.Code = "";
        } else {
          email.Code = final_code[0];
        }

        all_codes.push(email);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // console.log(all_codes)
  return all_codes;
}


/**
 * This function checks whether the email subject contains one of the given
 * keywords, ensuring irrelevant emails are not scanned for verification codes
 */
function check_subject(subject: string) {
  const likelySubjects: Array<string> = [
    "verify",
    "otp",
    "code",
    "auth",
    "security",
    "identity",
    "verification"
  ];
  var isValidSubject: boolean = false;

  for (let sub of likelySubjects) {
    if (subject.toLowerCase().includes(sub)) {
      isValidSubject = true;
    }
  }

  return isValidSubject;
}


/**
 * This function scans potential verification code matches, and if any of the codes are
 * preceded or followed by the given characters, are deemed as invalid codes (since they
 * are likely to be a part of a URL and not an actual code)
 */
function removeURL(email: Email, verif_codes: RegExpMatchArray) {
  const invalid_chars = ["=", "/", "?", ".", ":"];
  var valid_codes = [];

  for (let code of verif_codes) {
    const index = email.Body.indexOf(code);
    const before = email.Body.charAt(index - 1);
    const after = email.Body.charAt(index + verif_codes.length);
    if (!(invalid_chars.includes(before) || invalid_chars.includes(after))) {
      valid_codes.push(code);
    }
  }

  return valid_codes;
}

function getTimeDifference(dateStr: string): DayDate {
    const then = new Date(dateStr).getTime(); // parsed safely
    const now = Date.now();
    let diffMs = now - then;

    if (diffMs < 0) diffMs = 0;  // Clamp future timestamps to "now"

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
}

function formatDates(time: DayDate) : string {
    if (time.days >= 1) {
        console.log(`${time.days} day(s) ago`);
        return `${time.days} day(s) ago`
    } else if (time.hours >= 1) {
        console.log(`${time.hours} hour(s) ago`);
        return `${time.hours} hour(s) ago`
    } else if (time.minutes >= 1) {
        console.log(`${time.minutes} minute(s) ago`);
        return `${time.minutes} minute(s) ago`
    } else {
        console.log("now");
        return "now"
    }
}

async function main(){
  const auth = await authorize();
  const emails = await getEmails(auth);
  const codes = await getCode(emails);

  // console.log(`All emails: ${emails}`);
  console.log(JSON.stringify(emails, null, 2));
  console.log(`Codes retrieved: ${codes[0].Body}`)
  // Example usage with real email header time
  // const emailTime = "Fri, 13 Jun 2025 13:19:43 +0000"
  // const result = getTimeDifference(emailTime);
  // formatDates(result);
}

// main()
export { getCode };

