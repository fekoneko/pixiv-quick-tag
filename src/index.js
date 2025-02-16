const root = document.getElementById('root');
if (!root) throw new Error('Pixiv Quick Tag could not find #root element');

let rootObserver;

const addTagButtons = () => {
  const workLinks = document.querySelectorAll('a[data-gtm-value][href^="/artworks/"]');
  workLinks.forEach((workLink) => {
    const workId = workLink.href.split('/').pop();
    const workContainer = workLink.parentElement.parentElement.parentElement;

    const tagButtonsContainer = document.createElement('div');
    workContainer.appendChild(tagButtonsContainer);
    tagButtonsContainer.classList.add('pixiv-quick-tag-buttons');

    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.placeholder = 'Add tag...';
    tagButtonsContainer.appendChild(tagInput);

    const applySection = document.createElement('div');
    applySection.classList.add('apply-section');
    tagButtonsContainer.appendChild(applySection);

    const applyButton = document.createElement('button');
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

    rootObserver.disconnect();
  });
};

rootObserver = new MutationObserver(addTagButtons);
rootObserver.observe(root, { childList: true, subtree: true });
