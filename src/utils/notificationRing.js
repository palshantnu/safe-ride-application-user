import Sound from 'react-native-sound';

Sound.setCategory('Playback');

let ringSound = null;

export const playNotificationSound = () => {
  console.log('playNotificationSound() called');
  stopNotificationSound();

  try {
    // Android resolves this against res/raw by name, without the extension.
    ringSound = new Sound('notification', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load notification sound:', error);
        return;
      }
      console.log('notification sound loaded, duration:', ringSound?.getDuration());
      ringSound?.setNumberOfLoops(-1);
      ringSound?.play((success) => {
        console.log('notification sound play finished, success:', success);
      });
    });
  } catch (e) {
    console.log('Sound() threw synchronously:', e);
  }
};

export const stopNotificationSound = () => {
  if (ringSound) {
    ringSound.stop(() => {
      ringSound?.release();
      ringSound = null;
    });
  }
};
