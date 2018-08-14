if (document.addEventListener) {
    document.addEventListener("resize", responsive, false);
} else if (document.attachEvent) {
    document.attachEvent("resize", responsive, false);
}
function responsive() {
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    console.log(width);
    console.log(height);
}