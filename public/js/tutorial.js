onload = function() {
  let elem = document.createElement('canvas');
  const WEBP_SUPPORTED = elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;

  document.getElementById('cover').remove();
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  modal.addEventListener('click', event => {
    modal.style.display = 'none';
  });
  document.querySelectorAll('.image').forEach(image => {
    image.addEventListener('click', event => {
      modal.style.display = 'flex';
      if (!WEBP_SUPPORTED) {
        modalImg.src = image.src;
      } else {
        modalImg.src = image.src.replace('web', 'backup').replace('webp', 'jpg');
      }
      console.log(modalImg.src);
    });
  });
}

function scrollTo(l) { document.getElementById(l).scrollIntoView({ behavior: 'smooth' }); }