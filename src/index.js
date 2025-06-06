const root = document.getElementById('__next');
if (!root) throw new Error('Pixiv Quick Tag could not find #__next element');

let activeWorkMenuWrapper = null;

const isPointInsideRect = ({ left, right, top, bottom }, x, y, shrink = 0) =>
  x >= left + shrink && x <= right - shrink && y >= top + shrink && y <= bottom - shrink;

const updateBookmark = (workId, tags, isPrivate) => {
  // TODO: expect this hell to break very soon, lol
  const nextData = JSON.parse(document.getElementById('__NEXT_DATA__').innerText);
  const token = JSON.parse(nextData.props.pageProps.serverSerializedPreloadedState).api.token;

  return fetch('https://www.pixiv.net/ajax/illusts/bookmarks/add', {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': token,
    },
    method: 'POST',
    body: JSON.stringify({
      illust_id: workId,
      restrict: isPrivate ? 1 : 0,
      comment: '',
      tags: tags,
    }),
  });
};

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
  pinnedTags.forEach((tag) => appendPinnedTagButtons(workMenu, tag));
};

const removePinnedTagButtons = (container, tag) => {
  let tagButtonContainers = container.querySelectorAll('.pixiv-quick-tag-pinned-tag');

  tagButtonContainers.forEach((tagButtonContainer) => {
    const tagButton = tagButtonContainer.firstChild;
    if (tagButton?.textContent === tag) tagButtonContainer.remove();
  });
};

const appendPinnedTagButtons = (container, tag) => {
  let pinnedTagsSections = container.querySelectorAll('.pixiv-quick-tag-pinned-tags-section');

  pinnedTagsSections.forEach((pinnedTagsSection) => {
    const tagButtonContainer = document.createElement('div');
    tagButtonContainer.classList.add('pixiv-quick-tag-pinned-tag');
    pinnedTagsSection.appendChild(tagButtonContainer);

    const tagButton = document.createElement('button');
    tagButton.type = 'button';
    tagButton.textContent = tag;
    tagButton.ariaPressed = 'false';
    tagButtonContainer.appendChild(tagButton);

    const removeTagButton = document.createElement('button');
    removeTagButton.type = 'button';
    removeTagButton.textContent = '×';
    tagButtonContainer.appendChild(removeTagButton);

    tagButton.onclick = () => {
      const isAriaPressed = tagButton.ariaPressed === 'true';

      if (isAriaPressed) {
        tagButton.ariaPressed = 'false';
        const hiddenInput = tagButtonContainer.querySelector('input');
        hiddenInput?.remove();
      } else {
        tagButton.ariaPressed = 'true';
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'text';
        hiddenInput.name = 'tags';
        hiddenInput.value = tag;
        hiddenInput.hidden = true;
        tagButtonContainer.appendChild(hiddenInput);
      }
    };

    removeTagButton.onclick = () => {
      if (removePinnedTag(tag)) removePinnedTagButtons(root, tag);
    };
  });
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

      appendPinnedTagButtons(root, input.value);
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

const hideWorkMenu = () => {
  activeWorkMenuWrapper?.remove();
  activeWorkMenuWrapper = null;
};

const showWorkMenu = (workContainer, workId) => {
  const workMenuWrapper = document.createElement('div');
  document.body.appendChild(workMenuWrapper);
  workMenuWrapper.classList.add('pixiv-quick-tag-work-menu-wrapper');

  activeWorkMenuWrapper?.remove();
  activeWorkMenuWrapper = workMenuWrapper;

  const containerRect = workContainer.getBoundingClientRect();
  workMenuWrapper.style.top = containerRect.top + containerRect.height - 10 + 'px';
  workMenuWrapper.style.left = containerRect.left + 'px';
  workMenuWrapper.style.width = containerRect.width + 'px';

  const isContainerOrMenuHovered = (mouseX, mouseY) => {
    const containerRect = workContainer.getBoundingClientRect();
    const menuRect = workMenuWrapper.getBoundingClientRect();
    const isContainerHovered = isPointInsideRect(containerRect, mouseX, mouseY, 5);
    const isMenuHovered = isPointInsideRect(menuRect, mouseX, mouseY, 5);

    return isContainerHovered || isMenuHovered;
  };

  const handleMouseLeave = (event) =>
    !isContainerOrMenuHovered(event.clientX, event.clientY) && hideWorkMenu();

  workContainer.addEventListener('mouseleave', handleMouseLeave);
  workMenuWrapper.addEventListener('mouseleave', handleMouseLeave);

  const workMenu = document.createElement('form');
  workMenuWrapper.appendChild(workMenu);
  workMenu.classList.add('pixiv-quick-tag-work-menu');

  appendPinnedTagsSection(workMenu);
  appendInputSection(workMenu);
  appendApplySection(workMenu);

  workMenu.onsubmit = async (event) => {
    event.preventDefault();

    const applyButton = workMenu.querySelector('button[type="submit"]');
    applyButton.disabled = true;
    applyButton.ariaInvalid = false;

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
};

const attachWorkMenus = () => {
  const workLinks = root.querySelectorAll('a[data-gtm-value][href^="/artworks/"]');
  workLinks.forEach((workLink) => {
    const workContainer = workLink.parentElement.parentElement.parentElement;
    const hasMenu = workContainer.classList.contains('pixiv-quick-tag-work-container');
    if (hasMenu) return;

    const workId = workLink.href.split('/').pop();
    workContainer.classList.add('pixiv-quick-tag-work-container');
    workContainer.addEventListener('mouseenter', () => showWorkMenu(workContainer, workId));
  });
};

window.addEventListener('scroll', hideWorkMenu);
window.addEventListener('resize', hideWorkMenu);

const rootObserver = new MutationObserver(attachWorkMenus);
rootObserver.observe(root, { childList: true, subtree: true });
