  document.addEventListener('DOMContentLoaded', function () {
    const slider = document.querySelector('.w-slider');
    let autoplayTimeout;

    // Fetch video URL from Vimeo API
    async function fetchVimeoVideoUrl(vimeoId, accessToken) {
      try {
        const response = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const data = await response.json();
        const files = data.files;
        if (Hls.isSupported()) {
          return files.find(file => file.quality === 'hls').link;
        } else if (window.MediaSource) {
          return files.find(file => file.quality === 'dash').link;
        } else {
          return files.find(file => file.quality === 'sd' && file.type === 'video/mp4').link;
        }
      } catch (error) {
        console.error('Failed to fetch Vimeo video URL:', error);
        return null;
      }
    }

    // Initialize and play video
    async function initializeAndPlayVideo(video) {
      const vimeoId = video.getAttribute('data-src');
      const accessToken = 'fb82081198895a76a7c4075f68aeb343';
      const videoUrl = await fetchVimeoVideoUrl(vimeoId, accessToken);

      if (!videoUrl) {
        console.error('No valid video URL found for Vimeo ID:', vimeoId);
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else if (window.MediaSource) {
        const player = dashjs.MediaPlayer().create();
        player.initialize(video, videoUrl, true);
      } else {
        video.src = videoUrl;
      }

      video.muted = true;
      video.autoplay = true;
      video.controls = false;
      video.setAttribute('playsinline', 'true');
      video.play().then(() => {
        video.style.opacity = 1;
        video.style.transition = 'opacity 0.8s';
        console.log('Video playing:', video);
      }).catch(error => {
        console.error('Video play error:', error, video);
      });
    }

    // Observe visible videos
    function observeVisibleVideos() {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            initializeAndPlayVideo(video);
          } else {
            video.pause();
            video.currentTime = 0;
            video.style.opacity = 0;
          }
        });
      }, observerOptions);

      const videos = document.querySelectorAll('.hero-slider-video');
      videos.forEach(video => {
        observer.observe(video);
      });
    }

    // Handle video end
    function handleVideoEnd(event) {
      const video = event.target;
      video.style.opacity = 0;

      setTimeout(() => {
        const activeSlide = video.closest('.w-slide');
        const image = activeSlide.querySelector('.hero-slider-img');
        if (image) {
          image.style.opacity = 1;
        }
      }, 800);

      clearTimeout(autoplayTimeout);
      autoplayTimeout = setTimeout(() => {
        document.querySelector('.w-slider-arrow-right').click();
      }, 1800);
    }

    // Attach event listeners to handle slide changes
    function attachSlideChangeListener() {
      if (slider) {
        $(slider).on('swipe slide', () => {
          handleSlideChange();
          startAutoplayOnVideoEnd();
          resumeAutoplay();
        });

        $(slider).on('click', '.w-slider-arrow-left, .w-slider-arrow-right, .w-slider-dot', () => {
          handleSlideChange();
          startAutoplayOnVideoEnd();
          resumeAutoplay();
        });
      } else {
        console.error('Slider element not found');
      }
    }

    // Handle slide changes
    function handleSlideChange() {
      const activeSlide = document.querySelector('.w-slide[aria-hidden="false"]');
      const videos = document.querySelectorAll('.hero-slider-video');
      videos.forEach(video => {
        const slide = video.closest('.w-slide');
        if (slide !== activeSlide) {
          video.pause();
          video.currentTime = 0;
          video.style.opacity = 0;
        } else {
          initializeAndPlayVideo(video);
        }
      });
    }

    // Start autoplay on video end
    function startAutoplayOnVideoEnd() {
      const videos = document.querySelectorAll('.hero-slider-video');
      videos.forEach(video => {
        video.removeEventListener('ended', handleVideoEnd);
        video.addEventListener('ended', handleVideoEnd);
      });
    }

    // Resume autoplay
    function resumeAutoplay() {
      clearTimeout(autoplayTimeout);
      const activeSlide = document.querySelector('.w-slide[aria-hidden="false"]');
      const video = activeSlide.querySelector('.hero-slider-video');
      if (video) {
        autoplayTimeout = setTimeout(() => {
          document.querySelector('.w-slider-arrow-right').click();
        }, video.duration * 1000 + 1800);
      }
    }

    observeVisibleVideos();
    attachSlideChangeListener();
    handleSlideChange();
    startAutoplayOnVideoEnd();

    // Initialize and play the first video on page load
    const firstVideo = document.querySelector('.hero-slider-video');
    if (firstVideo) {
      console.log('Initializing first video...');
      initializeAndPlayVideo(firstVideo);
    }
  });
