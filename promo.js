// Import necessary objects and libraries
import { CSS3DObject } from './libs/three.js-r132/examples/jsm/renderers/CSS3DRenderer.js';
const THREE = window.MINDAR.IMAGE.THREE;

// Function to create a YouTube player
const createYoutube = () => {
  return new Promise((resolve, reject) => {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    const onYouTubeIframeAPIReady = () => {
      const player = new YT.Player('player', {
        videoId: 'tL8uVDSvpNQ',
        events: {
          onReady: () => {
            resolve(player);
          }
        }
      });
    };

    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
  });
};

// Wait for the DOM content to be fully loaded before executing the code
document.addEventListener('DOMContentLoaded', () => {
  // Define an asynchronous function to start the AR experience
  const start = async () => {
    // Create a YouTube player using the createYoutube function
    const player = await createYoutube();

    // Create a MindARThree instance with the specified container and image target source
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/promotion.mind',
    });

    // Extract renderer, CSS renderer, scene, CSS scene, and camera from the MindARThree instance
    const { renderer, cssRenderer, scene, cssScene, camera } = mindarThree;

    // Create a CSS3DObject from an HTML element with the ID "ar-div"
    const obj = new CSS3DObject(document.querySelector("#ar-div"));

    // Add a CSS anchor and attach the CSS3DObject to it
    const cssAnchor = mindarThree.addCSSAnchor(0);
    cssAnchor.group.add(obj);

    // Define actions when the AR target is found and lost
    cssAnchor.onTargetFound = () => {
      player.playVideo();
    };
    cssAnchor.onTargetLost = () => {
      player.pauseVideo();
    };

    // Start the AR experience
    await mindarThree.start();

    // Rendering loop using the CSS renderer
    renderer.setAnimationLoop(() => {
      cssRenderer.render(cssScene, camera);
    });
  };

  // Start the AR setup
  start();
});
