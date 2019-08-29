function getHTMLString() {
    let windowWidth = window.innerWidth;
    let quotient = Math.floor((windowWidth/150));
    let html = "<div class=\"scroll\"></div>";

    for (var i = 0; i < (quotient - 1); i++) {
        html += "<div class=\"scroll\"></div>";
    }
    return html;
}
function setSize(){
    let windowWidth = window.innerWidth;
    console.log(windowWidth);
    let divisor = Math.floor(windowWidth/150.00);
    console.log(divisor);
    let result = (windowWidth/divisor);
    console.log(result);

    var elements = document.body.getElementsByClassName('scroll');
    var element;
    
    for (element of elements) {
        element.style.width = result + "px";
    }
}

function createBackground(html) {
    var wrapper = document.getElementById('wrapper');
    wrapper.innerHTML = "";
    var fragment = document.createDocumentFragment();
    var temp = document.createElement('div');

    temp.innerHTML = html;
    while(temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    
    return fragment;
}
function runAll() {
    var fragment = createBackground(getHTMLString());
    var target = document.getElementById('wrapper');
    target.insertBefore(fragment, target.childNodes[0]);
    setSize();
}
window.addEventListener("resize", function(){runAll();});
runAll();
document.getElementsByClassName('scroll').addEventListener("")