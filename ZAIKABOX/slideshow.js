const images = [
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
  'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
  'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg',
  'https://images.pexels.com/photos/920220/pexels-photo-920220.jpeg',
  'https://images.pexels.com/photos/326281/pexels-photo-326281.jpeg',
  'https://images.pexels.com/photos/718742/pexels-photo-718742.jpeg'
];

const slide1 = document.getElementById('bg-slideshow-1');
const slide2 = document.getElementById('bg-slideshow-2');
let currentImageIndex = 0;

// Set initial images
slide1.style.backgroundImage = `url(${images[currentImageIndex]})`;
slide1.style.opacity = 1;
currentImageIndex = (currentImageIndex + 1) % images.length;
slide2.style.backgroundImage = `url(${images[currentImageIndex]})`;

function crossfade() {
    if (slide1.style.opacity === '1') {
        // Fade out slide1, fade in slide2
        slide1.style.opacity = 0;
        slide2.style.opacity = 1;
    } else {
        // Fade out slide2, fade in slide1
        slide1.style.opacity = 1;
        slide2.style.opacity = 0;
    }

    // Load the next image into the transparent div
    currentImageIndex = (currentImageIndex + 1) % images.length;
    
    // Use a short delay to ensure the transition starts before changing the background
    setTimeout(() => {
        if (slide1.style.opacity === '0') {
            slide1.style.backgroundImage = `url(${images[currentImageIndex]})`;
        } else {
            slide2.style.backgroundImage = `url(${images[currentImageIndex]})`;
        }
    }, 2000); // Wait for the transition duration before changing the image
}

setInterval(crossfade, 10000);