let animationId = null, buttonState, axesState, gp, dt, bState, aState, y1, x1, y2, x2;
const HELD_DURATION = 50;

class InputHandler {
  #listeners = new Map();

  addEventListener(index, event, callback) {
    this.listeners.set([index, event], callback);
  }
  removeEventListener(index, event) {
    this.listeners.delete([index, event]);
  }

  trigger(index, event, value = null) {
    this.listeners.get([index, event])?.call(value);
  }
  clearAll() {
    this.listeners = new Map();
  }
};

const buttonHandler = new InputHandler();
const axesHandler = new InputHandler();

let c = 0 // TEST LOGGING

const inputLoop = (ts) => { // polls inputs at roughly the user's display refresh rate
  [gp] = navigator.getGamepads();
  if (!gp.connected) return;

  dt = Date.now() - ts;

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

  [y1, x1, y2, x2] = gp.axes;
  [[y1, x1], [y2, x2]].forEach((s, i) => {
    aState = axesState[i];

    if (s[0] !== aState[0] || s[1] !== aState[1]) {
      axesHandler.trigger(i, 'onmove', s);
      axesState[i] = s;
    }

    s.forEach((a, j) => { // individual axis handlers
      if (a) axesHandler.trigger(`${i}:${j}`, 'onactive', a);
    })
  });

  if (!(c++ % 200)) { // TEST LOGGING
    console.log(buttonState);
    console.log(1000 / dt);
  }

  animationId = requestAnimationFrame(inputLoop);
};

function mouseMove([y, x]) { // this doesn't actually have to be a `function` but i like my principles
  /*
    design thoughts: ideally, i should be able to move the mouse horizontally
    across the screen in about half a second at full tilt
 
    so as a baseline i'd want to move the cursor at a speed of [screen width]/[refresh rate] pixels at input magnitude 1.0
    thus, the pixels moved should be ([magnitude] * [screen width])/[refresh rate]
 
    but the actual input polling rate differs slightly from the refresh rate, so we'll want to sample dt instead 
  */


}

/* 
  we have to init handles through this function because the window doesn't have access to
  navigator.getGamepads() until a gamepad connection occurs
  
  this handler is called after the first gamepad input has been made, will need to do some
  future weatherproofing to manage cases where a user has multiple gamepads connected
  and/or connects/disconnects gamepads while the script is active
*/
function onGamepadConnected(event) {
  gp = navigator.getGamepads()[event.gamepad.index];
  console.log(`gamepad "${gp.id}" connected`, gp);
  buttonState = gp.buttons.map(b => Math.ceil(b.value));
  [y1, x1, y2, x2] = gp.axes; // assuming twin sticks (DOUBLE CHECK THAT THIS IS THE ACTUAL AXIS ORDER)
  axesState = [[y1, x1], [y2, x2]];

  inputLoop();
}

export const main = async () => {
  window.addEventListener('gamepadconnected', onGamepadConnected);
};

export const clean = async () => {
  window.removeEventListener('gamepadconnected', onGamepadConnected);
  cancelAnimationFrame(animationId); // thankfully doesn't throw errors if the frame id is still null
  buttonHandler.clearAll();
  axesHandler.clearAll();
};