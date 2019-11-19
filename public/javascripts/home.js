var sessions_button = document.querySelector('.session_button');


sessions_button.addEventListener('click', () => {
    let loc = window.location.href;
    window.location.href = (loc + 'sessions');
});