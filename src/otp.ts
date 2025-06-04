// const { authorize, getEmails } = require('./index');
import { Email, authorize, getEmails } from './index';

async function getCode() {
    var all_codes = []
    try {
        const auth = await authorize();
        const emails = await getEmails(auth);

        for (const email of emails) {
            const regex = /\b[A-Z0-9]{5,15}\b/g

            var verif_codes = email.Body.match(regex)

            if (verif_codes !== null && check_subject(email.Subject)) {
                var final_code = removeURL(email, verif_codes)

                if (final_code === null) {
                    email.Code = ""
                }

                else {
                    email.Code = final_code[0]
                }
                
                all_codes.push(email)
                // console.log(`Verification code is : ${verif_codes[0]}\nFrom: ${email.From}\nSubject: ${email.Subject}\n`)
                // all_codes.push({ "From": email.From, "To": email.To, "Time": email.Time, "Subject": email.Subject, "Code": final_code[0] })
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }

    // console.log(all_codes)
    return all_codes
};



//Checks if the subject is relevant to 
function check_subject(subject: string) {
    const likelySubjects: Array<string> = ['verify', 'otp', 'code', 'auth', 'security', 'identity'];
    var isValidSubject: boolean = false;

    for (let sub of likelySubjects) {
        if (subject.toLowerCase().includes(sub)) {
            isValidSubject = true;
        }
    }

    return isValidSubject;

}

//Eliminates codes that could be part of  a url
function removeURL(email: Email, verif_codes: RegExpMatchArray) {
    const invalid_chars = ['=', '/', '?', '.', ':'];
    var valid_codes = []

    for (let code of verif_codes) {
        const index = email.Body.indexOf(code)
        const before = email.Body.charAt(index - 1)
        const after = email.Body.charAt(index + verif_codes.length)
        if (!(invalid_chars.includes(before) || invalid_chars.includes(after))) {
            valid_codes.push(code)
        }
    }

    return valid_codes
}

export { getCode };
// getCode();
module.exports = {
    getCode
};

// getCode()