const root = document.getElementById('root');
if (!root) throw new Error('Pixiv Quick Tag could not find #root element');

let rootObserver;

const appendWorkMenuInputSection = (workMenu) => {
  const inputSection = document.createElement('div');
  inputSection.classList.add('pixiv-quick-tag-input-section');
  workMenu.appendChild(inputSection);

  const appendInput = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'tags';
    input.placeholder = 'Add tag...';
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
    const workId = workLink.href.split('/').pop();
    const workContainer = workLink.parentElement.parentElement.parentElement;

    const workMenu = document.createElement('form');
    workContainer.appendChild(workMenu);
    workMenu.classList.add('pixiv-quick-tag-work-menu');

    appendWorkMenuInputSection(workMenu);
    appendWorkMenuApplySection(workMenu);

    rootObserver.disconnect();
  });
};

rootObserver = new MutationObserver(appendWorkMenus);
rootObserver.observe(root, { childList: true, subtree: true });
