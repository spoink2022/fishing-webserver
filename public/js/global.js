function toggleDropdown() {
  let navbar = document.querySelector('navbar');
  let image = document.querySelector('#menuImg');
  if (navbar.style.top != '0px') {
    image.src = '../images/png/close.png';
    navbar.style.top = '0px';
    navbar.style.opacity = '1';
    disableScroll();
  }
  else {
    image.src = '../images/png/menu.png';
    navbar.style.top = '-100vh';
    navbar.style.opacity = '0';
    enableScroll();
  }
}

function disableScroll() {
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  window.onscroll = function() { window.scrollTo(scrollLeft, scrollTop); };
}
function enableScroll() { window.onscroll = function() {}; }