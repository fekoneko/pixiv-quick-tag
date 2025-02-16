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

const getPinnedTags = () => {
  try {
    const pinnedTags = JSON.parse(localStorage.getItem('pixivQuickTagPinnedTags'));
    if (!Array.isArray(pinnedTags)) throw new Error('Invalid pinned tags');

    return pinnedTags;
  } catch {
    return [];
  }
};

const appendPinnedTag = (tag) => {
  const pinnedTags = getPinnedTags();
  if (pinnedTags.includes(tag)) return false;

  const newPinnedTags = JSON.stringify([...pinnedTags, tag]);
  localStorage.setItem('pixivQuickTagPinnedTags', newPinnedTags);
  return true;
};

const removePinnedTag = (tag) => {
  const pinnedTags = getPinnedTags();
  if (!pinnedTags.includes(tag)) return false;

  const newPinnedTags = JSON.stringify(pinnedTags.filter((pinnedTag) => pinnedTag !== tag));
  localStorage.setItem('pixivQuickTagPinnedTags', newPinnedTags);
  return true;
};

const appendPinnedTagsSection = (workMenu) => {
  pinnedTagsSection = document.createElement('div');
  pinnedTagsSection.classList.add('pixiv-quick-tag-pinned-tags-section');
  workMenu.appendChild(pinnedTagsSection);

  const pinnedTags = getPinnedTags();
  pinnedTags.forEach((tag) => appendPinnedTagButton(workMenu, tag));
};

const appendPinnedTagButton = (workMenu, tag) => {
  let pinnedTagsSection = workMenu.querySelector('.pixiv-quick-tag-pinned-tags-section');
  if (!pinnedTagsSection) return;

  const tagContainer = document.createElement('div');
  tagContainer.classList.add('pixiv-quick-tag-pinned-tag');
  pinnedTagsSection.appendChild(tagContainer);

  const tagButton = document.createElement('button');
  tagButton.type = 'button';
  tagButton.textContent = tag;
  tagButton.ariaPressed = 'false';
  tagContainer.appendChild(tagButton);

  const removeTagButton = document.createElement('button');
  removeTagButton.type = 'button';
  removeTagButton.textContent = '×';
  tagContainer.appendChild(removeTagButton);

  tagButton.onclick = () => {
    const isAriaPressed = tagButton.ariaPressed === 'true';

    if (isAriaPressed) {
      tagButton.ariaPressed = 'false';
      const hiddenInput = tagContainer.querySelector('input');
      hiddenInput?.remove();
    } else {
      tagButton.ariaPressed = 'true';
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.name = 'tags';
      hiddenInput.value = tag;
      hiddenInput.hidden = true;
      tagContainer.appendChild(hiddenInput);
    }
  };

  removeTagButton.onclick = () => {
    if (removePinnedTag(tag)) tagContainer.remove();
  };
};

const appendInputSection = (workMenu) => {
  const inputSection = document.createElement('div');
  inputSection.classList.add('pixiv-quick-tag-input-section');
  workMenu.appendChild(inputSection);

  const removeInput = (inputContainer) => {
    inputContainer.remove();
    inputSection.lastChild?.firstChild?.focus();
  };

  const appendInput = () => {
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('pixiv-quick-tag-input-container');
    inputSection.appendChild(inputContainer);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'tags';
    input.placeholder = 'Custom tag...';
    inputContainer.appendChild(input);

    const pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.textContent = 'pin';
    pinButton.hidden = true;

    input.oninput = () => {
      if (input.value.length > 0) {
        pinButton.hidden = false;
        if (inputSection.lastChild?.firstChild?.value !== '') appendInput();
      } else {
        pinButton.hidden = true;
        if (inputSection.childNodes.length > 1) removeInput(inputContainer);
      }
    };

    pinButton.onclick = () => {
      if (!appendPinnedTag(input.value)) return;

      appendPinnedTagButton(root, input.value);
      removeInput(inputContainer);
      if (inputSection.childNodes.length === 0) appendInput();
    };
    inputContainer.appendChild(pinButton);
  };
  appendInput();
};

const appendApplySection = (workMenu) => {
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
  const workLinks = root.querySelectorAll('a[data-gtm-value][href^="/artworks/"]');
  workLinks.forEach((workLink) => {
    const workContainer = workLink.parentElement.parentElement.parentElement;
    const hasMenu = workContainer.getElementsByClassName('pixiv-quick-tag-work-menu').length > 0;
    if (hasMenu) return;

    const workMenu = document.createElement('form');
    workContainer.appendChild(workMenu);
    workMenu.classList.add('pixiv-quick-tag-work-menu');

    appendPinnedTagsSection(workMenu);
    appendInputSection(workMenu);
    appendApplySection(workMenu);

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
