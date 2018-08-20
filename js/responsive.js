if (document.addEventListener) {
    window.addEventListener('load', responsive);
    window.addEventListener('resize', responsive);
} else if (document.attachEvent) {
    window.attachEvent('load', responsive);
    window.attachEvent('resize', responsive);
}
function responsive() {
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}