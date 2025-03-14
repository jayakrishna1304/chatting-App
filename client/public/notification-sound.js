// Create a notification sound using Web Audio API
// This is used by the chat application for message notifications

document.addEventListener('DOMContentLoaded', () => {
  const createNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 500;
    
    // Ramp up, then down for a nice "ding" sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    
    // Save to an audio file
    const recorder = new MediaRecorder(audioContext.destination.stream);
    const chunks = [];
    
    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      const audioURL = URL.createObjectURL(blob);
      
      // Create an audio element and download the file
      const audio = document.createElement('audio');
      audio.src = audioURL;
      
      const link = document.createElement('a');
      link.href = audioURL;
      link.download = 'message-notification.mp3';
      link.click();
    };
    
    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, 500);
  };
  
  // Add a button to generate the sound
  const button = document.createElement('button');
  button.innerText = 'Generate Notification Sound';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.padding = '10px';
  button.style.background = '#6366f1';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', createNotificationSound);
  
  document.body.appendChild(button);
});