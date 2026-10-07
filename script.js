document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('heroCanvas');
  const heroBgImage = document.getElementById('heroBgImage');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  const currentYearSpan = document.getElementById('currentYear');

  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // ==========================================================================
  // 1. CONTROLE DO MENU MOBILE & NAVEGAÇÃO SUAVE
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      e.preventDefault();
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: targetId === '#hero' ? 0 : offsetPosition,
          behavior: 'smooth'
        });
      }

      if (navMenu && navMenu.classList.contains('is-active')) {
        navMenu.classList.remove('is-active');
        if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-active');
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target) && navMenu.classList.contains('is-active')) {
        navMenu.classList.remove('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ==========================================================================
  // 2. SEQUÊNCIA DE IMAGENS EM ALTA PERFORMANCE NO CANVAS (SCROLL DRIVEN)
  // ==========================================================================
  if (canvas) {
    const context = canvas.getContext('2d', { alpha: false });
    const frameCount = 192; // 192 frames extraídos
    const images = new Array(frameCount);
    const loadedStatus = new Array(frameCount).fill(false);

    const getFrameUrl = (index) => {
      const paddedIndex = String(index + 1).padStart(4, '0');
      return `public/frames/frame_${paddedIndex}.jpg`;
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.scale(dpr, dpr);
      renderCurrentFrame();
    };

    const drawImageProp = (img) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      const imgRatio = imgWidth / imgHeight;
      const screenRatio = width / height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (screenRatio > imgRatio) {
        drawWidth = width;
        drawHeight = width / imgRatio;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      if (heroBgImage && heroBgImage.style.opacity !== '0') {
        heroBgImage.style.opacity = '0';
      }
    };

    let currentFrameIndex = 0;
    let targetFrameIndex = 0;
    let isAnimating = false;

    const renderCurrentFrame = () => {
      const roundedIndex = Math.round(currentFrameIndex);
      const safeIndex = Math.min(Math.max(roundedIndex, 0), frameCount - 1);

      if (images[safeIndex] && loadedStatus[safeIndex]) {
        drawImageProp(images[safeIndex]);
      } else {
        // Encontra o frame carregado mais próximo
        for (let offset = 1; offset < frameCount; offset++) {
          const prev = safeIndex - offset;
          const next = safeIndex + offset;
          if (prev >= 0 && images[prev] && loadedStatus[prev]) {
            drawImageProp(images[prev]);
            break;
          }
          if (next < frameCount && images[next] && loadedStatus[next]) {
            drawImageProp(images[next]);
            break;
          }
        }
      }
    };

    const animateFrames = () => {
      const diff = targetFrameIndex - currentFrameIndex;
      currentFrameIndex += diff * 0.45;

      if (Math.abs(diff) < 0.01) {
        currentFrameIndex = targetFrameIndex;
      }

      renderCurrentFrame();

      if (Math.abs(targetFrameIndex - currentFrameIndex) > 0.01) {
        requestAnimationFrame(animateFrames);
      } else {
        isAnimating = false;
      }
    };

    const onScroll = () => {
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollHeight <= 0) return;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const progress = Math.min(Math.max(scrollY / totalScrollHeight, 0), 1);

      targetFrameIndex = progress * (frameCount - 1);

      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animateFrames);
      }
    };

    const preloadFrames = () => {
      // 1. Carrega o primeiro frame imediatamente
      const firstImg = new Image();
      firstImg.src = getFrameUrl(0);
      firstImg.onload = () => {
        images[0] = firstImg;
        loadedStatus[0] = true;
        renderCurrentFrame();
      };

      // 2. Carrega frames intermediários em alta prioridade (passo de 10)
      for (let i = 10; i < frameCount; i += 10) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          images[i] = img;
          loadedStatus[i] = true;
        };
      }

      // 3. Carrega o restante progressivamente
      setTimeout(() => {
        for (let i = 1; i < frameCount; i++) {
          if (!images[i]) {
            const img = new Image();
            img.src = getFrameUrl(i);
            img.onload = () => {
              images[i] = img;
              loadedStatus[i] = true;
            };
          }
        }
      }, 500);
    };

    preloadFrames();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==========================================================================
  // 3. FORMULÁRIO INTERATIVO DE CONSULTA DE COBERTURA
  // ==========================================================================
  const coverageForm = document.getElementById('coverageForm');
  const coverageResult = document.getElementById('coverageResult');
  const resultWhatsAppBtn = document.getElementById('resultWhatsAppBtn');
  const cepInput = document.getElementById('cepInput');
  const citySelect = document.getElementById('citySelect');

  if (coverageForm && coverageResult) {
    coverageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cepVal = cepInput ? cepInput.value.trim() : '';
      const cityVal = citySelect ? citySelect.value : 'sua região';

      if (!cepVal) return;

      const message = `Olá! Consultei viabilidade no site da TemNet para o endereço/CEP: "${cepVal}" (${cityVal}) e gostaria de contratar um plano de fibra óptica!`;
      const waUrl = `https://wa.me/5575931980000?text=${encodeURIComponent(message)}`;

      if (resultWhatsAppBtn) {
        resultWhatsAppBtn.setAttribute('href', waUrl);
      }

      coverageResult.style.display = 'flex';
      coverageResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ==========================================================================
  // 4. FAQ ACCORDION INTERATIVO
  // ==========================================================================
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isAlreadyOpen = item.classList.contains('is-open');

      // Fecha todos os outros
      document.querySelectorAll('.faq-item').forEach(otherItem => {
        otherItem.classList.remove('is-open');
        const otherBtn = otherItem.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isAlreadyOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
