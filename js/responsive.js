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

    var heightSub = height * .5;
    var widthSub = width * .5;


    var marginHeight = (height - heightSub)/2;
    var marginWidth = (width - widthSub)/2;

    document.getElementById("wrapper").style.margin = marginHeight + "px " + marginWidth + "px"; 
}