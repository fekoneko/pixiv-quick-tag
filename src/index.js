const root = document.getElementById('root');
if (!root) throw new Error('Pixiv Quick Tag could not find #root element');

const updateBookmark = (workId, tags, isPrivate) =>
  fetch('https://www.pixiv.net/ajax/illusts/bookmarks/add', {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': localStorage.getItem('xzToken'),
    },
    method: 'POST',
    body: JSON.stringify({
      illust_id: workId,
      restrict: isPrivate ? 1 : 0,
      comment: '',
      tags: tags,
    }),
  });

const appendWorkMenuInputSection = (workMenu) => {
  const inputSection = document.createElement('div');
  inputSection.classList.add('pixiv-quick-tag-input-section');
  workMenu.appendChild(inputSection);

  const appendInput = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'tags';
    input.placeholder = 'Custom tag...';
    input.oninput = () => {
      if (input.value.length > 0 && inputSection.lastChild?.value !== '') {
        appendInput();
      }
      if (input.value.length === 0 && inputSection.childNodes.length > 1) {
        input.remove();
        inputSection.lastChild?.focus();
      }
    };
    inputSection.appendChild(input);
  };
  appendInput();
};

const appendWorkMenuApplySection = (workMenu) => {
  const applySection = document.createElement('div');
  applySection.classList.add('pixiv-quick-tag-apply-section');
  workMenu.appendChild(applySection);

  const applyButton = document.createElement('button');
  applyButton.type = 'submit';
  applyButton.textContent = 'Apply';
  applySection.appendChild(applyButton);

  const privateCheckbox = document.createElement('input');
  privateCheckbox.name = 'private';
  privateCheckbox.type = 'checkbox';
  privateCheckbox.id = 'pixiv-quick-tag-private-checkbox';
  applySection.appendChild(privateCheckbox);

  const privateLabel = document.createElement('label');
  privateLabel.textContent = 'private';
  privateLabel.htmlFor = privateCheckbox.id;
  applySection.appendChild(privateLabel);
};

const appendWorkMenus = () => {
  const workLinks = document.querySelectorAll('a[data-gtm-value][href^="/artworks/"]');
  workLinks.forEach((workLink) => {
    const workContainer = workLink.parentElement.parentElement.parentElement;
    const hasMenu = workContainer.getElementsByClassName('pixiv-quick-tag-work-menu').length > 0;
    if (hasMenu) return;

    const workMenu = document.createElement('form');
    workContainer.appendChild(workMenu);
    workMenu.classList.add('pixiv-quick-tag-work-menu');

    appendWorkMenuInputSection(workMenu);
    appendWorkMenuApplySection(workMenu);

    workMenu.onsubmit = async (event) => {
      event.preventDefault();

      const applyButton = workMenu.querySelector('button[type="submit"]');
      applyButton.disabled = true;
      applyButton.ariaInvalid = false;

      const workId = workLink.href.split('/').pop();
      const formData = new FormData(workMenu);
      const tags = formData.getAll('tags').slice(0, -1);
      const isPrivate = formData.get('private') === 'on';

      const response = await updateBookmark(workId, tags, isPrivate);
      if (response.ok) {
        applyButton.textContent = 'Applied';
      } else {
        applyButton.textContent = 'Error';
        applyButton.ariaInvalid = true;
      }
      applyButton.disabled = false;
    };
  });
};

const rootObserver = new MutationObserver(appendWorkMenus);
rootObserver.observe(root, { childList: true, subtree: true });
