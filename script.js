// AR setup using MindAR and Three.js

// No GLTFLoader import needed for 2D PNGs

document.addEventListener("DOMContentLoaded", async () => {
    // Get status message element for user feedback
    const statusMessage = document.getElementById("status-message");
    if (!statusMessage) {
        console.error("Error: Status message element with ID 'status-message' not found in HTML.");
        return; // Cannot proceed without status element
    }
    statusMessage.textContent = "Initializing AR...";
    console.log("1. DOM Content Loaded. Starting AR initialization sequence.");

    // --- Early checks for critical libraries ---
    if (typeof THREE === 'undefined') {
        const msg = "Error: THREE.js library not loaded. Check script tag in tryon.html.";
        statusMessage.textContent = msg;
        console.error("2. " + msg);
        return;
    }
    console.log("3. THREE.js detected.");

    if (typeof window.MINDAR === 'undefined' || typeof window.MINDAR.FACE === 'undefined' || typeof window.MINDAR.FACE.MindARThree === 'undefined') {
        const msg = "Error: MindAR library not loaded or incorrectly referenced. Check script tag path in tryon.html.";
        statusMessage.textContent = msg;
        console.error("4. " + msg);
        return;
    }
    console.log("5. MindAR.FACE.MindARThree detected.");

    // Retrieve hat ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hatId = urlParams.get('hat'); // Default to 'beanie' if no hat specified
    console.log(`6. Attempting to load hat: ${hatId}`);

    // Define hat properties including their PNG image paths
    // IMPORTANT: Make sure these paths are correct relative to your tryon.html file.
    // Ensure your PNGs have transparent backgrounds if you want them to overlay cleanly.
    const hatData = {
        'black_bucket_hat': {
            imagePath: './assets/facemesh/hat-template/black_bucket_hat.png', // Path to your PNG
            // --- Crucial Parameters to Adjust for Your PNG ---
            // These values are HIGHLY dependent on the image's content, aspect ratio,
            // and how the hat is positioned within the PNG itself.
            // YOU WILL LIKELY NEED TO ADJUST THESE BY TRIAL AND ERROR!
            // Start with small increments/decrements.
            scale: 5.2,    // Overall size: Adjust until the hat is the right size on your head.
                           // Increase if hat is too small, decrease if too large.
            positionX: -0.1, // Horizontal adjustment: Negative moves LEFT, positive moves RIGHT.
                            // Adjust to center the hat on your head.
            positionY: 0.3,  // Vertical adjustment: Positive moves UP, negative moves DOWN.
                            // Adjust to sit on top of the head.
            positionZ: -0.15, // Depth adjustment: Positive moves BACK (into head), negative moves FORWARD (off face).
                             // Adjust to make it sit properly in front/on top of forehead.
            rotationX: -0.15 * Math.PI, // Tilt forward/backward. Adjust subtly. 0 = flat face-on.
                                        // A negative value here can tilt it slightly back.
            rotationY: 0,    // Spin left/right. Leave as 0 unless you want it skewed.
            rotationZ: 0     // Roll side-to-side. Leave as 0 unless you want it tilted on one side.
        },
        'fashion_bucket_hat': {
            imagePath: './assets/facemesh/hat-template/fashion_bucket_hat.png', // Placeholder PNG
            scale: 6.5,
            positionX: -0.1,
            positionY: 0.2,
            positionZ: -0.15, // Slightly forward for cap brim
            rotationX: -0.15 * Math.PI,
            rotationY: 0,
            rotationZ: 0
        },
        'bucket_hat_from_africa': {
            imagePath: './assets/facemesh/hat-template/fashion_bucket_hat_from_africa.png', // Placeholder PNG
            scale: 6.2,
            positionX: -0.0,
            positionY: 0.4,
            positionZ: -0.15, // Slightly forward for cap brim
            rotationX: -0.15 * Math.PI,
            rotationY: 0,
            rotationZ: 0
        }
    };

    const selectedHat = hatData[hatId]; // Fallback to beanie if hatId not found
    if (!selectedHat.imagePath) {
        statusMessage.textContent = `Error: No image path defined for hat '${hatId}'.`;
        console.error(`7. Error: No image path defined for hat '${hatId}'. Please check hatData configuration.`);
        return; // Stop execution if no image path
    }

    // Function to load a texture (PNG image)
    const loadTexture = (path) => {
        console.log(`8. Attempting to load image texture from: ${path}`);
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                path,
                (texture) => {
                    console.log(`9. Successfully loaded image texture from: ${path}. Image dimensions: ${texture.image.width}x${texture.image.height}`);
                    resolve(texture);
                },
                undefined, // Progress callback (optional)
                (error) => {
                    console.error('10. An error happened while loading the image texture:', path, error);
                    reject(new Error(`Failed to load image texture from ${path}. Check path and file integrity. Error: ${error.message}`));
                }
            );
        });
    };

    try {
        const container = document.querySelector("#ar-container");
        if (!container) {
            statusMessage.textContent = "Error: AR container not found in HTML.";
            console.error("11. Error: Could not find #ar-container element.");
            return;
        }
        console.log("12. AR container found.");

        // Initialize MindARThree
        console.log("13. Initializing MindARThree...");
        const mindarThree = new window.MINDAR.FACE.MindARThree({
            container: container,
            // For debugging: enable these listeners
            // onCameraOpen: () => { console.log("MindAR: Camera opened successfully!"); },
            // onCameraClose: () => { console.log("MindAR: Camera closed."); },
            // onTrackingLost: () => { console.log("MindAR: Face tracking lost."); statusMessage.textContent = "Face tracking lost. Look at camera!"; },
            // onTrackingUpdate: (event) => { /* console.log("MindAR: Tracking update:", event.detail.transform); */ statusMessage.textContent = "Tracking face..."; }
        });
        console.log("14. MindARThree initialized.");

        // Extract renderer, scene, and camera from mindarThree
        const { renderer, scene, camera } = mindarThree;

        // --- Add Lighting to the Scene ---
        // For 2D textures on planes, lighting has less effect, but it's good practice
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Full ambient light
        scene.add(ambientLight);
        console.log("15. Lighting added to scene (Ambient Light for 2D).");

        // --- Load Hat Image and Create 2D Plane Object ---
        statusMessage.textContent = `Loading ${hatId.replace('_', ' ')} image...`;
        console.log(`16. Starting to load ${hatId.replace('_', ' ')} PNG image from: ${selectedHat.imagePath}`);
        const hatTexture = await loadTexture(selectedHat.imagePath);

        // Create a plane geometry. Size might need adjustment based on your image aspect ratio
        // A common practice is to size the plane based on the texture's aspect ratio.
        const planeWidth = 1; // Base width of the plane in MindAR units (arbitrary, then scaled)
        const planeHeight = planeWidth * (hatTexture.image.height / hatTexture.image.width);
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight); // Creates a flat rectangle

        // Use MeshBasicMaterial for 2D images as it doesn't react to lights (just shows texture)
        const material = new THREE.MeshBasicMaterial({
            map: hatTexture,
            transparent: true, // Crucial for PNG transparency
            side: THREE.DoubleSide, // Render both sides of the plane
            alphaTest: 0.5 // Renders fragments only if alpha value is greater than this threshold
        });
        const hatObject = new THREE.Mesh(geometry, material);
        console.log("17. 2D hat plane created and textured successfully.");

        // Apply scale, position, and rotation from hatData
        hatObject.scale.set(selectedHat.scale, selectedHat.scale, selectedHat.scale);
        // Ensure positionX is used in the set method.
        hatObject.position.set(selectedHat.positionX, selectedHat.positionY, selectedHat.positionZ);
        hatObject.rotation.set(selectedHat.rotationX, selectedHat.rotationY, selectedHat.rotationZ);
        console.log("18. Hat object scaled, positioned, and rotated.");


        // --- Attach Hat to MindAR Anchor ---
        console.log("19. Adding anchor and attaching hat object...");
        // Anchor 168 is generally near the top of the head for hats.
        const anchor = mindarThree.addAnchor(168);
        anchor.group.add(hatObject); // Add the hat object to the anchor's group
        console.log("20. Hat object attached to anchor.");

        statusMessage.textContent = "AR experience ready. Look at your camera!";
        console.log("21. Attempting to start MindAR.");

        // Start the AR experience and set up the rendering loop
        await mindarThree.start();
        console.log("22. MindAR started. Setting up animation loop.");
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

    } catch (error) {
        console.error("X. Critical Error during AR initialization or image loading:", error);
        statusMessage.textContent = `Error: ${error.message}. Please check console for details. Ensure camera permissions, MindAR library path, and image paths are correct.`;

        // Provide more detailed error message to user
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            statusMessage.textContent = "Camera access denied. Please allow camera permissions to use the AR Studio.";
        } else if (error.message.includes("MINDAR.FACE.MindARThree is not a constructor")) {
            statusMessage.textContent = "MindAR library not loaded. Check the script path in tryon.html.";
        } else if (error.message.includes("Failed to load image texture")) {
            statusMessage.textContent = `Failed to load image from ${selectedHat.imagePath}. Check path and file integrity.`;
        } else if (error.message.includes("Failed to fetch dynamically imported module")) {
            statusMessage.textContent = "A module failed to load. If you were trying to load GLTF, ensure GLTFLoader.js is correctly linked.";
        }
    }

    // Handle window resize to keep AR canvas responsive
    window.addEventListener('resize', () => {
        const arContainer = document.getElementById('ar-container');
        if (arContainer && mindarThree) {
            mindarThree.onResize();
            mindarThree.camera.aspect = arContainer.offsetWidth / arContainer.offsetHeight;
            mindarThree.camera.updateProjectionMatrix();
            mindarThree.renderer.setSize(arContainer.offsetWidth, arContainer.offsetHeight);
        }
    });
});
