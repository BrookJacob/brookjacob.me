var index = 1;

document.getElementById('next').addEventListener('click', function() {next(1)});
document.getElementById('prev').addEventListener('click', function() {next(-1)});

showSlides(index);

function next(n) {
    showSlides(index += n);
}

function showSlides(n) {
    var i;
    var frames = document.getElementsByClassName('frame');
    if (n > frames.length) {index = 1}
    if (n < 1) {index = frames.length}
    for (i = 0; i < frames.length; i++) {
        frames[i].style.display = "none";
    }
    frames[index-1].style.display = "block";
}