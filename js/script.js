/* 
  Project: Saroj Jawa - Professional Numerologist
  Description: Main JavaScript for UI interactions
*/

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });
  }

  // 2. Sticky Header & Shadow on Scroll
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.boxShadow = 'var(--shadow-md)';
      header.style.backgroundColor = 'rgba(253, 251, 247, 0.98)';
    } else {
      header.style.boxShadow = 'var(--shadow-sm)';
      header.style.backgroundColor = 'rgba(253, 251, 247, 0.95)';
    }
  });

  // 3. Fade-in Animation Observer
  const fadeElements = document.querySelectorAll('.fade-in');

  const fadeObserverOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, fadeObserverOptions);

  fadeElements.forEach(el => fadeObserver.observe(el));

  // 4. Testimonial Slider
  const track = document.querySelector('.testimonial-track');
  if (track) {
    const slides = Array.from(track.children);
    const dots = document.querySelectorAll('.slider-dot');
    let currentIndex = 0;

    const updateSlider = (index) => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach(d => d.classList.remove('active'));
      dots[index].classList.add('active');
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateSlider(currentIndex);
      });
    });

    // Auto slide
    setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlider(currentIndex);
    }, 5000);
  }

  // 5. Active Link Highlighting
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // FAQ Accordion Toggle Logic
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerDiv = item.querySelector('.faq-answer');
    if (questionBtn && answerDiv) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close other open FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          }
        });
        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          answerDiv.style.maxHeight = answerDiv.scrollHeight + 40 + 'px';
        } else {
          item.classList.remove('active');
          answerDiv.style.maxHeight = null;
        }
      });
    }
  });
});

/* ==================================================
   Dual-Tool Tabbed Panel Logic
   (Kundli Generator & Numerology Calculator)
================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switcher
    const tabBtns = document.querySelectorAll('.tab-nav-btn');
    const tabCards = document.querySelectorAll('.tab-tool-card');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class
        tabBtns.forEach(b => b.classList.remove('active'));
        tabCards.forEach(c => c.classList.remove('active'));

        // Add active class
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetCard = document.getElementById(targetId);
        if (targetCard) targetCard.classList.add('active');
      });
    });

    // 2. Kundli Generator API Integration
    const getApiBaseUrl = () => {
      const hostname = window.location.hostname;
      // Local development (Live Server runs on 5500, Flask on 5001)
      if ((hostname === '127.0.0.1' || hostname === 'localhost') && window.location.port === '5500') {
        return 'http://127.0.0.1:5001';
      }
      // Production or if Flask is serving the frontend directly
      return '';
    };
    const API_BASE_URL = getApiBaseUrl();

    const handleKundliSubmit = async (nameId, dobId, timeId, placeId, spinnerId, resultViewId, resultTitleId, prefix) => {
      const nameInput = document.getElementById(nameId).value.trim();
      const dobInput = document.getElementById(dobId).value;
      const timeInput = document.getElementById(timeId).value;
      const placeInput = document.getElementById(placeId).value.trim();

      if (!nameInput || !dobInput || !timeInput || !placeInput) {
        alert('Please fill in all details (Name, DOB, Time, Place).');
        return;
      }

      const spinner = document.getElementById(spinnerId);
      const resultView = document.getElementById(resultViewId);
      const resultTitle = document.getElementById(resultTitleId);

      if (spinner) spinner.style.display = 'inline-block';
      if (resultView) resultView.style.display = 'none';

      try {
        const API_BASE_URL = "https://sarojjawa-backend.onrender.com"; // Live Render Backend URL

        const response = await fetch(`${API_BASE_URL}/api/astrology/kundli`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: nameInput,
            dob: dobInput,
            time: timeInput,
            place: placeInput
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 50)}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.data) {
          const kundliData = data.data;
          const lagnaNo = kundliData.lagna.rashi_no;

          // Render Houses 1 to 12
          for (let i = 1; i <= 12; i++) {
            let rashiNo = ((lagnaNo - 1 + (i - 1)) % 12) + 1;

            const rashiEl = document.getElementById(`${prefix}h${i}-rashi`);
            if (rashiEl) rashiEl.textContent = rashiNo;

            const planetsEl = document.getElementById(`${prefix}h${i}-planets`);
            if (planetsEl && kundliData.houses_grid[i]) {
              planetsEl.textContent = kundliData.houses_grid[i].join(', ');
            } else if (planetsEl) {
              planetsEl.textContent = '';
            }
          }

          // Update Summary Badge
          const summaryEl = document.getElementById(prefix ? `${prefix}kundli-summary` : 'kundli-summary');
          if (summaryEl) {
            summaryEl.innerHTML = `<h5 style="margin-bottom: 5px; color: var(--color-primary);">Ascendant: ${kundliData.lagna.rashi} (Lord: ${kundliData.lagna.lord})</h5>`;
            summaryEl.style.display = 'block';
          }

          if (resultTitle) {
            resultTitle.textContent = prefix ? nameInput : `Generated for ${nameInput}`;
          }
          if (resultView) {
            resultView.style.display = prefix ? 'block' : 'flex';
            resultView.classList.add('fade-in', 'visible');
            if (prefix) resultView.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          alert('Failed to generate Kundli: ' + (data.message || 'Please try again.'));
        }
      } catch (error) {
        console.error('Error generating kundli:', error);
        alert('Error: ' + error.message + '\n\nEnsure the backend is running and reachable.');
      } finally {
        if (spinner) spinner.style.display = 'none';
      }
    };

    // Attach to index.html Form
    const btnKundli = document.getElementById('btn-generate-kundli');
    if (btnKundli) {
      btnKundli.addEventListener('click', () => {
        handleKundliSubmit('kundli-name', 'kundli-dob', 'kundli-time', 'kundli-place', 'kundli-spinner', 'kundli-result', 'kundli-result-title', '');
      });
    }

    // Attach to kundli-checker.html Form
    const formKundli = document.getElementById('kundliForm');
    if (formKundli) {
      formKundli.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('genBtn');
        let loaderId = null;
        if (btn) {
          const loader = btn.querySelector('.loader');
          if (loader) {
            loader.id = 'chk-spinner';
            loaderId = 'chk-spinner';
          }
        }
        handleKundliSubmit('chk-name', 'chk-dob', 'chk-time', 'chk-place', loaderId, 'kundliResult', 'resName', 'c-');
      });
    }

    // 3. Numerology Calculator Engine
    const btnNum = document.getElementById('btn-calc-num');
    if (btnNum) {
      btnNum.addEventListener('click', () => {
        const dobInput = document.getElementById('num-dob').value;
        if (!dobInput) {
          alert('Please select a Date of Birth.');
          return;
        }

        const reduceToSingleDigit = (num) => {
          while (num > 9) {
            num = String(num).split('').reduce((acc, curr) => acc + parseInt(curr), 0);
          }
          return num;
        };

        const dateParts = dobInput.split('-'); // YYYY-MM-DD
        if (dateParts.length !== 3) return;

        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];

        // Mulank: sum of day digits
        const daySum = String(parseInt(day, 10)).split('').reduce((acc, curr) => acc + parseInt(curr), 0);
        const mulank = reduceToSingleDigit(daySum);

        // Bhagyank: sum of all digits
        const fullDateStr = `${year}${month}${day}`;
        const fullDateSum = fullDateStr.split('').reduce((acc, curr) => acc + parseInt(curr), 0);
        const bhagyank = reduceToSingleDigit(fullDateSum);

        // Vedic/Chaldean Traits Mapping
        const numTraits = {
          1: 'Sun - Leadership, Independence, Ambition',
          2: 'Moon - Intuition, Harmony, Cooperation',
          3: 'Jupiter - Creativity, Expression, Optimism',
          4: 'Rahu - Practicality, Organization, Discipline',
          5: 'Mercury - Adaptability, Freedom, Communication',
          6: 'Venus - Responsibility, Love, Compassion',
          7: 'Ketu - Analysis, Wisdom, Spirituality',
          8: 'Saturn - Material Success, Power, Authority',
          9: 'Mars - Humanitarianism, Compassion, Energy'
        };

        document.getElementById('mulank-val').textContent = mulank;
        document.getElementById('mulank-trait').textContent = numTraits[mulank] || '';

        document.getElementById('bhagyank-val').textContent = bhagyank;
        document.getElementById('bhagyank-trait').textContent = numTraits[bhagyank] || '';

        const numResult = document.getElementById('num-result');
        numResult.style.display = 'flex';
        numResult.classList.add('fade-in', 'visible');
      });
    }
  });
})();

// Force-trigger Hero Video Playback
document.addEventListener('DOMContentLoaded', () => {
  const heroVideo = document.getElementById('mainHeroVideo');
  const fallbackImg = document.getElementById('heroFallbackImg');

  if (heroVideo) {
    heroVideo.muted = true; // Ensure it's muted to allow autoplay
    heroVideo.play().catch(error => {
      console.warn('Autoplay prevented or video failed to load:', error);
      if (fallbackImg) {
        fallbackImg.style.display = 'block';
        heroVideo.style.display = 'none';
      }
    });
  }
});
