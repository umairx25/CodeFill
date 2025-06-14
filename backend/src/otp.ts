/**
 * This file contains the logic for extracting verification codes, given a 
 * list of user's email information
 */


import { Email, authorize, getEmails, signOut } from "./index";


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

async function main(){
  const auth = await authorize();
  const emails = await getEmails(auth);
  const codes = await getCode(emails);

  // console.log(`All emails: ${emails}`);
  console.log(JSON.stringify(emails, null, 2));
  console.log(`Codes retrieved: ${codes[0].Body}`)
}

export { getCode };


main()