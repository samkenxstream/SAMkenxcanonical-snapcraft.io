import lightbox from './lightbox';

// TEMPLATES
const templates = {
  row: (content) => `
    <div class="row">${content}</div>
  `,

  screenshot: (screenshot) => `
    <div class="col-2">
      <label
        ${screenshot.status === 'delete' ? '' : 'tabindex="0"'}
        class="p-screenshot ${screenshot.status === 'delete' ? 'is-deleted' : ''} ${screenshot.selected ? 'is-selected' : ''}">
        <input class="p-screenshot__checkbox" tabindex="-1" type="checkbox" ${screenshot.selected ? 'checked="checked"' : ''} >
        <img
          class="p-screenshot__image"
          src="${screenshot.url}"
          alt=""
        />
      </label>
    </div>
  `,

  empty: () => `
    <div class="col-12">
      <a class="p-empty-add-screenshots js-add-screenshots">Add images</a>
    </div>
  `,

  changes: (newCount, deleteCount) => {
    if (!newCount && !deleteCount) {
      return '';
    }
    return `
      <p>
        ${newCount ? newCount + ' image' + (newCount > 1 ? 's' : '') + ' to upload. ' : ''}
        ${deleteCount ? deleteCount + ' image' + (deleteCount > 1 ? 's' : '') + ' to delete.' : ''}
      </p>
    `;
  }
};

// INIT SCREENSHOTS
function initSnapScreenshotsEdit(screenshotsToolbarElId, screenshotsWrapperElId, state, setState) {
  // DOM elements
  const screenshotsToolbarEl = document.getElementById(screenshotsToolbarElId);
  const screenshotsWrapper = document.getElementById(screenshotsWrapperElId);

  // actions on state
  const addScreenshots = (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setState({
        images: state.images.concat([{
          file, url: URL.createObjectURL(file),
          name: file.name,
          type: "screenshot",
          status: "new"
        }])
      });
    }
  };

  const deleteScreenshot = (screenshot) => {
    if (screenshot.status === 'new') {
      const index = state.images.findIndex(image => image.selected);
      state.images.splice(index, 1);
    } else {
      screenshot._previousStatus = screenshot.status;
      screenshot.status = 'delete';
    }

    setState();
  };

  const selectScreenshot = (url) => {
    state.images.forEach(image => image.selected = false);

    const screenshot = state.images.filter(image => image.url === url)[0];

    if (url && screenshot && screenshot.status !== 'delete') {
      screenshot.selected = true;
    }
  };

  const renderScreenshots = (screenshots) => {
    if (screenshots.length) {
      // show first 6 images in one row
      let html = templates.row(screenshots.slice(0, 6).map(templates.screenshot).join(''));

      // if there is more screenshots (some marker for deletion?) show second row
      if (screenshots.length > 6) {
        html += templates.row(screenshots.slice(6, 12).map(templates.screenshot).join(''));
      }

      const newScreenshots = screenshots.filter(image => image.status === 'new').length;
      const deleteScreenshots = screenshots.filter(image => image.status === 'delete').length;
      html += templates.row(templates.changes(newScreenshots, deleteScreenshots));

      screenshotsWrapper.innerHTML = html;
    } else {
      screenshotsWrapper.innerHTML = templates.empty();
    }
  };

  const render = () => {
    const screenshots = state.images.filter(image => image.type === 'screenshot');
    renderScreenshots(screenshots);

    if (screenshots.filter(image => image.status !== 'delete').length === 5) {
      document.querySelector('.js-add-screenshots').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-add-screenshots').removeAttribute('disabled');
    }

    if (screenshots.filter(image => image.selected).length === 0) {
      document.querySelector('.js-delete-screenshot').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-delete-screenshot').removeAttribute('disabled');
    }
  };

  render();

  const onScreenshotsChange = function() {
    addScreenshots(this.files);
    render();
  };

  // delegated click handlers
  document.addEventListener("click", function(event){
    // Delete screenshot
    if (event.target.closest('.js-delete-screenshot')) {
      if (event.target.closest('.js-delete-screenshot').disabled) {
        return;
      }

      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];
      if (screenshot) {
        deleteScreenshot(screenshot);
        selectScreenshot();
      }
      render();
    } else if (event.target.closest('.js-fullscreen-screenshot')) {
      if (event.target.closest('.js-fullscreen-screenshot').disabled) {
        return;
      }

      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      // if none is selected pick first screenshot from list
      if (!screenshot) {
        screenshot = state.images.filter(image => image.type === 'screenshot')[0];
      }

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    } else {
      // unselect any screenshots when clicked outside of them
      selectScreenshot();
    }

    // clicking on [+] add screenshots button
    if (event.target.closest('.js-add-screenshots')) {
      if (event.target.closest('.js-add-screenshots').disabled) {
        return;
      }

      event.preventDefault();

      const input = document.createElement('input');
      input.type = "file";
      input.accept = "image/x-png,image/gif,image/jpeg";
      input.name="screenshots";
      input.hidden = "hidden";

      screenshotsToolbarEl.parentNode.appendChild(input);
      input.addEventListener("change", onScreenshotsChange);
      input.click();
    }

    // clicking on screenshot to select it
    if (event.target.closest('.p-screenshot')) {
      event.preventDefault();
      const img = event.target.closest('.p-screenshot').querySelector('.p-screenshot__image');
      selectScreenshot(img.src);
      setTimeout(() => {
        render();
      }, 50);
      return;
    }

    render();
  });

  screenshotsWrapper.addEventListener('keydown', (event) => {
    if ((event.key === " " || event.key == "Spacebar") &&
        event.target.closest('.p-screenshot')) {
      event.preventDefault();
      const img = event.target.closest('.p-screenshot').querySelector('.p-screenshot__image');
      selectScreenshot(img.src);
      setTimeout(() => {
        render();
        // after rendering find image with same src and focus it back
        screenshotsWrapper.querySelector(`[src="${img.src}"]`).closest('.p-screenshot').focus();
      }, 50);
      return;
    }
  });

  document.addEventListener('dblclick', event => {
    if (event.target.classList.contains('p-screenshot__image')) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    }
  });
}

export {
  initSnapScreenshotsEdit,
  // for testing
  templates
};
