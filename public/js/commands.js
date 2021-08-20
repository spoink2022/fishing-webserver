onload = function() {
  document.getElementById('cover').remove();
  let last = document.getElementsByClassName('selected')[0];

  if (preset && ['statistics', 'information', 'clans'].includes(preset)) {
    document.getElementById('gameplay').classList.remove('visible');
    last.classList.remove('selected');
    last = document.querySelectorAll('#type-selector p')[{statistics: 1, information: 2, clans: 3}[preset]];
    last.classList.add('selected');
    document.getElementById(preset).classList.add('visible');
  }

  document.querySelectorAll('#type-selector p').forEach(element => {
    element.addEventListener('click', event => {
      event.target.classList.add('selected');
      if (event.target != last) {
        last.classList.remove('selected');
        document.getElementById(last.innerHTML).classList.remove('visible');
        last = event.target;
        document.getElementById(last.innerHTML).classList.add('visible');

        let selected = document.getElementsByClassName('bottom-selected')[0];
        if (selected) {
          selected.classList.remove('bottom-selected');
          selected.parentElement.classList.remove('command-selected');
        }
      }
    });
  });
}

function expand(e) {
  let command = e.parentElement;
  let bottom = command.getElementsByClassName('bottom')[0];
  opened = bottom;
  if (bottom.classList.contains('bottom-selected')) { bottom.classList.remove('bottom-selected'); }
  else { bottom.classList.add('bottom-selected'); }
  if (command.classList.contains('command-selected')) { command.classList.remove('command-selected'); }
  else { command.classList.add('command-selected'); }
}