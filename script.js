document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('heroCanvas');
  const heroBgImage = document.getElementById('heroBgImage');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  // ==========================================================================
  // 1. CONTROLE DO MENU MOBILE
  // ==========================================================================
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

    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================================
  // 2. SEQUÊNCIA DE IMAGENS EM ALTA PERFORMANCE NO CANVAS (SCROLL DRIVEN)
  // ==========================================================================
  if (canvas) {
    const context = canvas.getContext('2d', { alpha: false });
    const frameCount = 192; // Total de 192 frames extraídos do animacao rot raque.mp4
    const images = new Array(frameCount);
    const loadedStatus = new Array(frameCount).fill(false);

    const getFrameUrl = (index) => {
      const paddedIndex = String(index + 1).padStart(4, '0');
      return `public/frames/frame_${paddedIndex}.jpg`;
    };

    // Ajusta dimensões do canvas para a resolução da tela (High-DPI / Retina)
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

    // Desenha o frame atual com efeito "object-fit: cover" centralizado
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
        // Encontra o frame carregado mais próximo para evitar tela preta
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

    // Animação contínua e suave de interpolação entre frames
    const animateFrames = () => {
      const diff = targetFrameIndex - currentFrameIndex;

      // Interpolação suave (LERP) para transição a 60-120fps
      currentFrameIndex += diff * 0.22;

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

    // Pré-carregamento inteligente das imagens
    const preloadFrames = () => {
      // 1. Carrega o primeiro frame imediatamente para renderização instantânea
      const firstImg = new Image();
      firstImg.src = getFrameUrl(0);
      firstImg.onload = () => {
        images[0] = firstImg;
        loadedStatus[0] = true;
        renderCurrentFrame();
      };

      // 2. Carrega os demais frames em segundo plano
      for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          images[i] = img;
          loadedStatus[i] = true;
        };
      }
    };

    // Inicialização
    preloadFrames();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Força primeira leitura do scroll
    onScroll();
  }
});
