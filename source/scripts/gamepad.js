let buttonState, axesState, gp, bState;
const HELD_DURATION = 50;

const buttonHandler = Object.freeze({
  listeners: new Map(),

  addEventListener(index, event, callback) {
    this.listeners.set([index, event], callback);
  },
  removeEventListener(index, event, callback) {
    this.listeners.delete([index, event]);
  },

  trigger(index, event) {
    this.listeners.get([index, event])?.call();
  }
});

let c = 0, t = 0, dt = 0;

const inputLoop = () => { // seems to poll inputs at around 71-83 input frames per second, so no problems there
  gp = navigator.getGamepads()[0];
  if (!gp.connected) return;

  gp.buttons.forEach((b, i) => {
    bState = buttonState[i];
    if (b.value && !bState) { // button pressed
      buttonState[i] = 1;
      buttonHandler.trigger(i, 'onpressed');
    } else if (!b.value && bState) { // button released
      buttonState[i] = 0;
      buttonHandler.trigger(i, 'onreleased');
    } else if (b.value && bState) { // button held
      ++buttonState[i];
      if (bState === HELD_DURATION) buttonHandler.trigger(i, 'onheld');
    }
  });


  if (!(c++ % 200)) {
    console.log(buttonState);
    console.log(1000 / dt);
  } else {
    dt = Date.now() - t;
    t = Date.now();
  }

  requestAnimationFrame(inputLoop);
}


function onGamepadConnected(event) {
  gp = navigator.getGamepads()[event.gamepad.index];
  console.log(`gamepad "${gp.id}" connected`, gp);
  buttonState = gp.buttons.map(b => Math.ceil(b.value));

  inputLoop();
}

export const main = async () => {
  window.addEventListener('gamepadconnected', onGamepadConnected);
};

export const clean = async () => {
  window.removeEventListener('gamepadconnected', onGamepadConnected);
};