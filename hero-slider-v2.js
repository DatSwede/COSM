(function($) {
  console.log("Script started");

  var $slider = $('.cms-hero-list');
  var $slides = $('.hero-slider-item');
  var currentIndex = 0;
  var totalSlides;
  var isTransitioning = false;
  var isDuplicateSlide = false;

  function initSlider() {
    console.log("Initializing slider");

    // Clone the first slide and add it to the end
    var $firstSlide = $slides.first().clone(true);
    $firstSlide.addClass('duplicate');
    $slider.append($firstSlide);

    // Re-initialize Webflow interactions
    Webflow.require('ix2').init();

    // Re-calculate the total slides after duplication
    totalSlides = $slider.children('.hero-slider-item').length;

    // Set initial styles
    $slider.css({
      width: `${totalSlides * 100}%`,
      display: 'flex',
      transition: 'transform 1s ease-in-out'
    });

    $slider.children('.hero-slider-item').css({
      width: `${100 / totalSlides}%`,
      flex: `0 0 ${100 / totalSlides}%`
    });

    // Initialize all videos
    $slider.find('.hero-slider-item').each(function(index) {
      var $video = $(this).find('video');
      if ($video.length > 0) {
        initVideo($video[0], index);
      }
    });

    // Start with the first slide
    showSlide(0);
  }

  function initVideo(video, index) {
    video.muted = true;
    video.playsinline = true;
    video.loop = false;
    video.preload = 'auto';
    video.controls = false;

    // When the video ends, check if it's the duplicate slide
    video.onended = function() {
      console.log(`Video ${index} ended`);
      if (!isTransitioning) {
        if (isDuplicateSlide) {
          stitchToFirstSlide();
        } else {
          nextSlide();
        }
      }
    };

    video.oncanplay = function() {
      console.log(`Video ${index} is ready to play`);
    };
  }

  function showSlide(index) {
    isTransitioning = true;
    
    // Simulate click 2 (exit) on the current slide before transitioning
    if (currentIndex !== index) {
      simulateClick(currentIndex, 2);
    }

    currentIndex = index;
    isDuplicateSlide = (index === totalSlides - 1);
    var translateX = -currentIndex * (100 / totalSlides);
    $slider.css('transform', `translateX(${translateX}%)`);

    // Pause all videos
    $slider.find('video').each(function() {
      this.pause();
    });

    // Play the current video
    var $currentSlide = $slider.children('.hero-slider-item').eq(currentIndex);
    var currentVideo = $currentSlide.find('video')[0];
    if (currentVideo) {
      if (index === 0 && $slider.data('justStitched')) {
        // For first slide after stitching, set to last frame
        currentVideo.currentTime = currentVideo.duration;
        $slider.data('justStitched', false);
      } else {
        // For all other slides, including duplicate, start from the beginning
        currentVideo.currentTime = 0;
      }
      
      var playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Started playing video ${index}`);
          isTransitioning = false;
          // Simulate click 1 (enter) on the new slide after transition is complete
          setTimeout(() => simulateClick(currentIndex, 1), 50);
        }).catch(error => {
          console.error("Error playing video:", error);
          isTransitioning = false;
        });
      } else {
        isTransitioning = false;
        // Simulate click 1 (enter) on the new slide
        setTimeout(() => simulateClick(currentIndex, 1), 50);
      }
    } else {
      isTransitioning = false;
      // Simulate click 1 (enter) on the new slide
      setTimeout(() => simulateClick(currentIndex, 1), 50);
    }

    console.log(`Showing slide ${index}`);
  }

  function nextSlide() {
    var nextIndex = (currentIndex + 1) % totalSlides;
    showSlide(nextIndex);
  }

  function stitchToFirstSlide() {
    console.log("Stitching to first slide");
    
    // Capture styles from the duplicate slide
    var $duplicateSlide = $slider.children('.hero-slider-item').last();
    var $duplicateContent = $duplicateSlide.find('.hero-slider-content');
    var capturedStyles = {};
    
    $duplicateContent.find('*').each(function(index) {
      var $element = $(this);
      var elementStyles = $element.attr('style');
      capturedStyles[index] = elementStyles;
    });

    // Quick reset to the first slide without transition
    $slider.css('transition', 'none');
    $slider.css('transform', 'translateX(0)');
    
    // Force a browser reflow
    $slider[0].offsetHeight;
    
    // Apply captured styles to the first slide
    var $firstSlide = $slider.children('.hero-slider-item').first();
    var $firstSlideContent = $firstSlide.find('.hero-slider-content');
    
    $firstSlideContent.find('*').each(function(index) {
      var $element = $(this);
      if (capturedStyles[index]) {
        $element.attr('style', capturedStyles[index]);
      }
    });

    // Reset variables
    currentIndex = 0;
    isDuplicateSlide = false;
    $slider.data('justStitched', true);

    // Play the video on the first slide from the last frame
    var firstVideo = $firstSlide.find('video')[0];
    if (firstVideo) {
      firstVideo.currentTime = firstVideo.duration;
      firstVideo.play();
    }

    // Re-enable transition for future slides
    setTimeout(() => {
      $slider.css('transition', 'transform 1s ease-in-out');
      
      // Trigger a minimal interaction to ensure Webflow animations still occur if needed
      simulateClick(0, 1);
      
      isTransitioning = false;
    }, 50);

    console.log("Stitching complete");
  }

  function simulateClick(slideIndex, clickNumber) {
    var $slide = $slider.children('.hero-slider-item').eq(slideIndex);
    var $triggerElement = $slide.find('[slide="trigger"]');
    
    if ($triggerElement.length > 0) {
      console.log(`Simulating click ${clickNumber} on slide ${slideIndex}`);
      $triggerElement[0].click();
    } else {
      console.log(`No trigger element found for slide ${slideIndex}`);
    }
  }

  // Initialize the slider when the document is ready
  $(document).ready(initSlider);
})(jQuery);
