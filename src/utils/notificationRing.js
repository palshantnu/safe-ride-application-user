import Sound from 'react-native-sound';

Sound.setCategory('Playback');

let ringSound = null;
let isRinging = false;
let listeners = [];
// Bumped on every play/stop so a Sound that finishes loading after it has
// been superseded (e.g. stop() called, or another play() started, while the
// file was still loading) knows to discard itself instead of starting to
// play a ring nobody asked for anymore.
let ringToken = 0;

const setRingingState = (value) => {
  isRinging = value;
  listeners.forEach((listener) => listener(isRinging));
};

// Lets any screen/component (e.g. a floating mute button) react to the ring
// starting/stopping without needing its own local state.
export const subscribeRingState = (listener) => {
  listeners.push(listener);
  listener(isRinging);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

export const isNotificationRinging = () => isRinging;

export const playNotificationSound = () => {
  console.log('playNotificationSound() called');
  stopNotificationSound();
  setRingingState(true);
  const token = ++ringToken;

  try {
    // Android resolves this against res/raw by name, without the extension.
    const sound = new Sound('notification', Sound.MAIN_BUNDLE, (error) => {
      // A stop() (or another play()) happened while this was still loading —
      // don't let it start ringing after the fact.
      if (token !== ringToken) {
        sound.release();
        return;
      }
      if (error) {
        console.log('Failed to load notification sound:', error);
        setRingingState(false);
        return;
      }
      console.log('notification sound loaded, duration:', sound.getDuration());
      ringSound = sound;
      sound.setNumberOfLoops(-1);
      sound.play((success) => {
        console.log('notification sound play finished, success:', success);
      });
    });
  } catch (e) {
    console.log('Sound() threw synchronously:', e);
    setRingingState(false);
  }
};

export const stopNotificationSound = () => {
  ringToken++;
  setRingingState(false);
  if (ringSound) {
    const sound = ringSound;
    ringSound = null;
    sound.stop(() => sound.release());
  }
};
