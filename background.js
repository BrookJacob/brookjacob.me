function getHTMLString() {
    let windowWidth = window.innerWidth;
    let quotient = Math.floor(windowWidth/150);
    let html = "<div class=\"scroll\"></div>";
    let i = 0;

    for (i = 0; i < (quotient - 1); i += 1) {
        html += "<div class=\"scroll\"></div>";
    }
    return html;
}
function setSize(){
    let windowWidth = window.innerWidth;
    let divisor = Math.floor(windowWidth/150.00);
    let result = (windowWidth/divisor);

    let elements = document.body.getElementsByClassName("scroll");
    let element;
    for (element of elements) {
        element.style.width = result + "px";
    }
}

function createBackground(html) {
    let wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = "";
    let fragment = document.createDocumentFragment();
    let temp = document.createElement("div");

    temp.innerHTML = html;
    while(temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    return fragment;
}
function runAll() {
    let i = 0;
    let fragment = createBackground(getHTMLString());
    let target = document.getElementById("wrapper");
    target.insertBefore(fragment, target.childNodes[0]);
    setSize();
    let scrolls = document.getElementsByClassName("scroll");
    for (i = 0; i < scrolls.length; i += 1){
        scrolls[i].addEventListener("mouseover", function(){
            scrolls[i].style.animation = "100s scroll infinite linear reverse";
        });
        scrolls[i].addEventListener("mouseleave", function() {
            scrolls[i].style.animation = "100s scroll infinite linear normal";
        });
    }
}
window.addEventListener("resize", function(){runAll();});
runAll();