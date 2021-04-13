onload = function() {
  document.getElementById('cover').remove();
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  modal.addEventListener('click', event => {
    modal.style.display = 'none';
  });
  document.querySelectorAll('.image').forEach(image => {
    image.addEventListener('click', event => {
      modal.style.display = 'flex';
      modalImg.src = image.src;
    });
  });
}

function scrollTo(l) { document.getElementById(l).scrollIntoView({ behavior: 'smooth' }); }