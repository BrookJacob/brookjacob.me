var db = firebase.database();
var contactsRef = db.ref('contacts');

var form = document.getElementById('contact-form');
var cname = document.getElementById('contact-name');
var email = document.getElementById('email');
var message = document.getElementById('long-field');
var submitBtn  = document.getElementById('submitBtn');
var errorMessage = document.getElementById('error-message');

function checkEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return true;
    }
    return false;
}

function inputValidation(){
    if (cname.value == "" || cname.value == undefined) {
        errorMessage.innerHTML = "Please enter your name.";
        return false;
    }
    if (email.value == "" || !checkEmail(email.value)) {
        errorMessage.innerHTML = "Please enter a valid email address.";
        return false;
    }
    if (message.value == "") {
        errorMessage.innerHTML = "Please enter a message.";
        return false;
    }
    return true;
}

submitBtn.addEventListener('click', function(event) {
    event.preventDefault();
    errorMessage.innerHTML = "";
    errorMessage.style.opacity = '1';

    if (inputValidation()) {
        errorMessage.innerHTML = "You can expect to hear back from me soon.";
        contactsRef.push({
            name: cname.value,
            email: email.value,
            message: message.value,
        });
        form.reset();
    }
    setTimeout(function() {
        errorMessage.style.opacity = '0';
    }, 3000);
});