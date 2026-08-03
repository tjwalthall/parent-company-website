// Keep the mobile navigation simple and accessible without making it essential.
document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.querySelector('span').textContent = isOpen ? 'Menu' : 'Close';
    siteNav.classList.toggle('is-open', !isOpen);
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.querySelector('span').textContent = 'Menu';
      siteNav.classList.remove('is-open');
    }
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});
