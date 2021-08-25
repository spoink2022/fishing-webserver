onload = function() {
  document.getElementById('cover').remove();

  let avatar = document.getElementById('logo');
  if (username) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('discordName').innerHTML = username + ' | <a id="logout" href="/shop">Logout</a>';
  } else {
    avatar.style.display = 'none';
    document.getElementById('checkout').style.display = 'none';
  }

  let total = 0, checkout = document.getElementById('checkout');

  document.querySelectorAll('.add').forEach(element => {
    element.addEventListener('click', event => {
      if (total == 0) { checkout.setAttribute('type', 'submit'); checkout.style.opacity = '1'; }

      let temp = event.target.parentNode.children;
      let display = temp.item(1), form = temp.item(2);
      display.innerHTML = Number(display.innerHTML) + 1;
      form.value = Number(form.value) + 1;

      total += 1;
    });
  });

  document.querySelectorAll('.subtract').forEach(element => {
    element.addEventListener('click', event => {
      let temp = event.target.parentNode.children;
      let display = temp.item(1), form = temp.item(2);
      if (form.value != 0) {
        display.innerHTML = Number(display.innerHTML) - 1;
        form.value = Number(form.value) - 1;

        total -= 1;
        if (total == 0) { checkout.setAttribute('type', 'button'); checkout.style.opacity = '0.5'; }
      }
    });
  });
}