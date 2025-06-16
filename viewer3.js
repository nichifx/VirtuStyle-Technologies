import { loadGLTF, loadAudio } from './libs/loader.js';
const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.querySelector("#mindar-container"),
      imageTargetSrc: './assets/targets/fashion_bucket_hat_from_africa.mind',
    });

    const { renderer, scene, camera } = mindarThree;

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const gltf = await loadGLTF('./assets/models/fashion_bucket_hat_from_africa.glb');
    gltf.scene.scale.set(2.5, 2.5, 2.5);
    gltf.scene.position.set(0, 0, 0);

    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(gltf.scene);

    const audioClip = await loadAudio('./assets/sounds/fashion_bucket_hat_from_africa.mp3');
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audio = new THREE.Audio(listener);
    anchor.group.add(audio);
    audio.setBuffer(audioClip);
    audio.setLoop(true);
    audio.setVolume(2.0);

    anchor.onTargetFound = () => {
      audio.play();
    };
    anchor.onTargetLost = () => {
      audio.pause();
    };

    
    let rotateX = false;
    let rotateY = false;
    const originalRotation = gltf.scene.rotation.clone();
    const originalPosition = gltf.scene.position.clone();

    const btnX = document.getElementById("rotate-x");
    const btnY = document.getElementById("rotate-y");
    const resetBtn = document.getElementById("reset-model");

    if (!btnX || !btnY) {
      console.error("❌ Rotation buttons not found in the DOM!");
    } else {
      btnX.addEventListener("click", () => {
        rotateX = !rotateX;
        console.log("🔁 Rotate X:", rotateX);
      });

      btnY.addEventListener("click", () => {
        rotateY = !rotateY;
        console.log("🔁 Rotate Y:", rotateY);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
      rotateX = false;
      rotateY = false;
      gltf.scene.rotation.copy(originalRotation);
      gltf.scene.position.copy(originalPosition);
      console.log("🔄 Model reset to original position and rotation");
    });
    } else {
      console.error("❌ Reset button not found!");
    }

    await mindarThree.start();

    renderer.setAnimationLoop(() => {
      if (rotateX) gltf.scene.rotation.x += 0.01;
      if (rotateY) gltf.scene.rotation.y += 0.01;

      renderer.render(scene, camera);
    });
  };

  start();
});