const longPressDelay = 500;

let timeoutId;

function preventScroll(event) {
  event.preventDefault();
  clearTimeout(timeoutId);
}
function onContextMenu(event) {
  event.preventDefault();
}

export const onLongPress = (elem, func, moveFunc = null, endFunc = null, cancelFunc = null) => {
  if (elem.dataset.longpressEvent) return;

  elem.dataset.longpressEvent = true;

  function onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(event);
    }, longPressDelay);
  }
  function onTouchEnd(event) {
    endFunc && endFunc(event);
    preventScroll(event);
  }
  function onTouchMove(event) {
    moveFunc && moveFunc(event);
    preventScroll(event);
  }

  elem.addEventListener('touchstart', onTouchStart);
  elem.addEventListener('contextmenu', onContextMenu);
  elem.addEventListener('touchend', onTouchEnd);
  elem.addEventListener('touchmove', onTouchMove, { passive: false });
  cancelFunc && elem.addEventListener('touchcancel', cancelFunc);

  return () => {
    elem.dataset.longpressEvent = '';
    elem.removeEventListener('touchstart', onTouchStart);
    elem.removeEventListener('contextmenu', onContextMenu);
    elem.removeEventListener('touchend', onTouchEnd);
    elem.removeEventListener('touchmove', onTouchMove, { passive: false });
    elem.removeEventListener('touchcancel', cancelFunc);
  };
};