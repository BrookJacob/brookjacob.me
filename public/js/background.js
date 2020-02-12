/* generateHTMLString()
 * generates string of divs belonging to scroll class
 * based on window width / 150px
 * @returns {String}
*/
function generateHTMLString() {
    let clientWidth = document.body.clientWidth;
    let quotient = Math.floor(clientWidth/150);
    let html = "<div class=\"scroll\"></div>";
    let i;

    for (i = 0; i < (quotient - 1); i+= 1) {
        html += "<div class=\"scroll\"></div>";
    }
    return html;
}
/* setDivSize()
 * sets width of each div belonging to scroll
 * class according to how many times 150 can go into
 * window width evenly
 *
*/
function setDivSize(){
    let clientWidth = document.body.clientWidth;
    let result = (clientWidth/(Math.floor(clientWidth/150.00)));

    var elements = document.body.getElementsByClassName("scroll");
    var element;
    
    for (element of elements) {
        element.style.width = result + "px";
    }
}
/* createBackgroundFragment(String)
 * creates document fragment based on String
 * returned from generateHTMLString and removes
 * @params {String} html
 * @returns {Object} fragment
*/
function createBackgroundFragment(html) {
    var wrapper = document.getElementById("background");
    wrapper.innerHTML = "";
    var fragment = document.createDocumentFragment();
    var temp = document.createElement("div");

    temp.innerHTML = html;
    while(temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    
    return fragment;
}
/* adjustBackground()
 * inserts doc fragment into end of target node
*/
function adjustBackground() {
    var fragment = createBackgroundFragment(generateHTMLString());
    var target = document.getElementById("background");
    target.insertBefore(fragment, target.childNodes[10]);
    setDivSize();
    var scrolls = document.getElementsByClassName("scroll");
    var containerContent = document.getElementsByClassName("container-content");
    for (let j = 0; j < scrolls.length; j++) {
        var random = Math.floor(Math.random() * scrolls.length);
        console.log(random);
        containerContent[random].addEventListener("mouseover", function() {
            scrolls[j].style.animation = "100s scroll infinite linear reverse";
        });
        containerContent[random].addEventListener("mouseleave", function() {
            scrolls[j].style.animation = "100s scroll infinite linear normal";
        });
    }
}
window.addEventListener("resize", function(){adjustBackground();});
adjustBackground();