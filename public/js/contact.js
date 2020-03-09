var db = firebase.database();
var contactsRef = db.ref('contacts');

var form = document.getElementById('contact-form');
var cname = document.getElementById('contact-name');
var email = document.getElementById('email');
var message = document.getElementById('long-field');
var submitBtn  = document.getElementById('submitBtn');
var nameError = document.getElementById('contact-name-error');
var emailError = document.getElementById('contact-email-error');
var longfieldError = document.getElementById('long-field-error');

function checkEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return true;
    }
    return false;
}

function inputValidation(){
    errorThrown = 0;
    if (cname.value == "" || cname.value == undefined) {
        nameError.innerHTML = "Please enter your name.";
        nameError.style.opacity = '1';
        errorThrown = 1;
    } else {
        nameError.style.opacity = '0';
    }
    if (email.value == "" || !checkEmail(email.value)) {
        emailError.innerHTML = "Please enter a valid email address.";
        emailError.style.opacity = '1';
        errorThrown = 1;
    } else {
        emailError.style.opacity = '0';
    }
    if (message.value == "") {
        longfieldError.innerHTML = "Please enter a message.";
        longfieldError.style.opacity = '1';
        errorThrown = 1;
    } else {
        longfieldError.style.opacity = '0';
    }
    if (errorThrown == 1) {
        return false;
    }
    return true;
}

submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    if (inputValidation()) {
         alert("You can expect to hear back from me soon.");
        contactsRef.push({
            name: cname.value,
            email: email.value,
            message: message.value,
        });
        form.reset();
    }
    document.getElementById('contact-name').addEventListener("keyup", inputValidation);
    document.getElementById('email').addEventListener("keyup", inputValidation);
    document.getElementById('long-field').addEventListener("keyup", inputValidation);
});