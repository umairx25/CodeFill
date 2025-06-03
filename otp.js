const { authorize, getEmails } = require('./index');

async function getCode() {
    try {
        const auth = await authorize();
        const emails = await getEmails(auth);

        for (const email of emails) {
            const regex = /\b[A-Z0-9]{5,15}\b/g

            var verif_codes = email.Body.match(regex)

            if (verif_codes !== null && check_subject(email.Subject)){
                verif_codes = removeURL(email, verif_codes)
                console.log(`Verification code is : ${verif_codes[0]}\nFrom: ${email.From}\nSubject: ${email.Subject}\n`)
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

getCode();


//Checks if the subject is relevant to 
function check_subject(subject) {
    const likelySubjects = ['verify', 'otp', 'code', 'auth', 'security', 'identity'];
    isValidSubject = false;

    for (sub of likelySubjects) {
        if (subject.toLowerCase().includes(sub)) {
            isValidSubject = true;
        }
    }

    return isValidSubject;

}

//Eliminates codes that could be part of  a url
function removeURL(email, verif_codes) {
    const invalid_chars = ['=', '/', '?', '.', ':'];
    valid_codes = []

    for (code of verif_codes) {
        const index = email.Body.indexOf(code)
        const before = email.Body.charAt[index - 1]
        const after = email.Body.charAt[index + verif_codes.length]
        if (!(invalid_chars.includes(before) || invalid_chars.includes(after))) {
            valid_codes.push(code)
        }
    }

    return valid_codes
}