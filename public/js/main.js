const easingFn = function (t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

onload = function() {
  document.getElementById('cover').remove();
  let count1 = new CountUp('fishCaught', 0, fishCaught, 0, 2, { easingFn, separator: '' }); // add suffix: 'k' if it gets too big
  let count2 = new CountUp('tonsCaught', 0, tonsCaught, 3, 2, { easingFn });
  count1.start();
  count2.start();
  const element = document.getElementById('top');
  window.addEventListener('scroll', function() {
    if (!element) { return; }
    var distanceToTop = element.getBoundingClientRect().top + window.pageYOffset;
    var elementHeight = element.offsetHeight;
    var scrollTop = document.documentElement.scrollTop;
    var opacity = 1;
    if (scrollTop > distanceToTop) {
      opacity = 1 - (scrollTop - distanceToTop) / elementHeight * 2;
    }
    if (opacity >= 0) {
      element.style.opacity = opacity;
      element.style.transform = `translateY(${(1 - opacity) * 200}px)`
    }
  });
}