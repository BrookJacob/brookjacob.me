function getHTMLString() {
    let windowWidth = window.innerWidth;
    let quotient = Math.floor(windowWidth/150);
    let html = "<div class=\"scroll\"></div>";

    for (let i = 0; i < (quotient - 1); i++) {
        html += "<div class=\"scroll\"></div>";
    }
    return html;
}
function setSize(){
    let windowWidth = window.innerWidth;
    let divisor = Math.floor(windowWidth/150.00);
    let result = (windowWidth/divisor);

    var elements = document.body.getElementsByClassName("scroll");
    var element;
    
    for (element of elements) {
        element.style.width = result + "px";
    }
}

function createBackground(html) {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = "";
    var fragment = document.createDocumentFragment();
    var temp = document.createElement("div");

    temp.innerHTML = html;
    while(temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    
    return fragment;
}
function runAll() {
    var fragment = createBackground(getHTMLString());
    var target = document.getElementById("wrapper");
    target.insertBefore(fragment, target.childNodes[10]);
    setSize();
    var scrolls = document.getElementsByClassName("scroll");
    for (let i = 0; i < scrolls.length; i++){
        scrolls[i].addEventListener("touchstart", function(){
            scrolls[i].style.animation = "100s scroll infinite linear reverse";
        });
        scrolls[i].addEventListener("mouseover", function(){
            scrolls[i].style.animation = "100s scroll infinite linear reverse";
        });
        scrolls[i].addEventListener("touchend", function() {
            scrolls[i].style.animation = "100s scroll infinite linear normal";
        });
        scrolls[i].addEventListener("mouseleave", function() {
            scrolls[i].style.animation = "100s scroll infinite linear normal";
        });
    }
}
window.addEventListener("resize", function(){runAll();});
runAll();