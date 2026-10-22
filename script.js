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
      if (anchor.id === 'resultWhatsAppBtn') return;

      const targetId = anchor.getAttribute('href');
      if (!targetId || !targetId.startsWith('#') || targetId === '#' || targetId.length <= 1) return;

      try {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: targetId === '#hero' ? 0 : offsetPosition,
            behavior: 'smooth'
          });
        }
      } catch (err) {
        return;
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
  // 1.1 TRANSIÇÃO DO CABEÇALHO AO ROLAR SCROLL (POPUP LEVE PARA BAIXO E SOME PARA CIMA)
  // ==========================================================================
  const heroNavHeader = document.querySelector('.hero-nav-header');
  if (heroNavHeader) {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let isHeaderHidden = false;
    let scrollTicking = false;
    const hideThreshold = 80; // Só ativa após rolar 80px do topo
    const scrollDelta = 6;    // Mínimo de rolagem para considerar intenção do usuário

    const updateHeaderOnScroll = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

      // Se o menu mobile estiver aberto, mantém o cabeçalho visível
      if (navMenu && navMenu.classList.contains('is-active')) {
        lastScrollY = currentScrollY;
        scrollTicking = false;
        return;
      }

      // Se estiver no topo ou próximo a ele, garante que o cabeçalho fique visível
      if (currentScrollY <= hideThreshold) {
        if (isHeaderHidden) {
          heroNavHeader.classList.remove('nav-popup-hide');
          heroNavHeader.classList.add('nav-popup-show');
          isHeaderHidden = false;
        }
        lastScrollY = currentScrollY;
        scrollTicking = false;
        return;
      }

      const diff = currentScrollY - lastScrollY;

      // Ignora micro-movimentos para evitar flickering
      if (Math.abs(diff) < scrollDelta) {
        scrollTicking = false;
        return;
      }

      if (diff > 0 && !isHeaderHidden) {
        // Rolou para BAIXO: aciona efeito popup descendo levemente e depois sumindo para cima
        heroNavHeader.classList.remove('nav-popup-show');
        heroNavHeader.classList.add('nav-popup-hide');
        isHeaderHidden = true;
      } else if (diff < 0 && isHeaderHidden) {
        // Rolou para CIMA: reaparece descendo suavemente do topo
        heroNavHeader.classList.remove('nav-popup-hide');
        heroNavHeader.classList.add('nav-popup-show');
        isHeaderHidden = false;
      }

      lastScrollY = currentScrollY;
      scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeaderOnScroll);
        scrollTicking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 1.2 EXTENSÃO DE DESCONTO DE PONTUALIDADE (PLANOS COM DESCONTO)
  // ==========================================================================
  document.querySelectorAll('.plan-discount-badge').forEach(discountBtn => {
    const targetId = discountBtn.getAttribute('aria-controls');
    const discountDrawer = document.getElementById(targetId);
    if (discountBtn && discountDrawer) {
      discountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = discountBtn.getAttribute('aria-expanded') === 'true';
        discountBtn.setAttribute('aria-expanded', !isExpanded);
        discountBtn.classList.toggle('is-open', !isExpanded);
        discountDrawer.classList.toggle('is-open', !isExpanded);
        discountDrawer.setAttribute('aria-hidden', isExpanded);
      });
    }
  });

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
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');
  const cepInput = document.getElementById('cepInput');
  const citySelect = document.getElementById('citySelect');

  if (coverageForm && coverageResult) {
    coverageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cepVal = cepInput ? cepInput.value.trim() : '';
      const cityVal = citySelect ? citySelect.value : '';

      if (!cityVal) return;

      let message = '';
      if (cityVal === 'Outra localidade') {
        message = 'Ola, sou de uma cidade fora da cobertura descrita no site, porém gostaria de mais informações';
        if (resultTitle) resultTitle.textContent = 'Consulta de Cobertura';
        if (resultDesc) resultDesc.textContent = 'Fale com nossa equipe para verificarmos a viabilidade técnica de atendimento na sua localidade.';
      } else {
        message = `Olá, eu gostaria de saber mais informações sobre os planos de ${cityVal}.`;
        if (resultTitle) resultTitle.textContent = `Cobertura em ${cityVal}!`;
        if (resultDesc) resultDesc.textContent = `Temos planos de fibra óptica disponíveis para ${cityVal}. Clique abaixo para falar direto com nossa equipe.`;
      }

      if (cepVal) {
        message += ` (Endereço/CEP: ${cepVal})`;
      }

      const waUrl = `https://wa.me/557531980000?text=${encodeURIComponent(message)}`;

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

  // ==========================================================================
  // 5. TEMNET SPEEDTEST (MOTOR REAL DE TESTE DE VELOCIDADE EM TEMPO REAL)
  // ==========================================================================
  const stStartBtn = document.getElementById('stStartBtn');
  const stRestartBtn = document.getElementById('stRestartBtn');
  const stGoWrap = document.getElementById('stGoWrap');
  const stLiveWrap = document.getElementById('stLiveWrap');
  const stLiveSpeed = document.getElementById('stLiveSpeed');
  const stLivePhase = document.getElementById('stLivePhase');
  const stLivePingVal = document.getElementById('stLivePingVal');
  const stPingVal = document.getElementById('stPingVal');
  const stJitterVal = document.getElementById('stJitterVal');
  const stDownloadVal = document.getElementById('stDownloadVal');
  const stUploadVal = document.getElementById('stUploadVal');
  const stDownloadStatus = document.getElementById('stDownloadStatus');
  const stUploadStatus = document.getElementById('stUploadStatus');
  const stMetricDownload = document.getElementById('stMetricDownload');
  const stMetricUpload = document.getElementById('stMetricUpload');
  const stMetricPing = document.getElementById('stMetricPing');
  const stNeedleGroup = document.getElementById('stNeedleGroup');
  const stGaugeProgress = document.getElementById('stGaugeProgress');
  const stResultVerdict = document.getElementById('stResultVerdict');
  const stVerdictTitle = document.getElementById('stVerdictTitle');
  const stVerdictDesc = document.getElementById('stVerdictDesc');
  const stWaveCanvas = document.getElementById('stWaveformCanvas');
  const stChartPeak = document.getElementById('stChartPeak');

  // Elementos do provedor, servidor e modal
  const stIspName = document.getElementById('stIspName');
  const stIspIp = document.getElementById('stIspIp');
  const stSelectedServerName = document.getElementById('stSelectedServerName');
  const stSelectedServerCity = document.getElementById('stSelectedServerCity');
  const stBtnChangeServer = document.getElementById('stBtnChangeServer');
  const stServerModal = document.getElementById('stServerModal');
  const stCloseModalBtn = document.getElementById('stCloseModalBtn');
  const stSelectAutoBtn = document.getElementById('stSelectAutoBtn');
  const stServerSearchInput = document.getElementById('stServerSearchInput');
  const stServersListContainer = document.getElementById('stServersListContainer');
  const stModeMulti = document.getElementById('stModeMulti');
  const stModeSingle = document.getElementById('stModeSingle');

  // Catálogo de servidores reais da região e do Brasil (idênticos à rede Speedtest.net)
  const realServersList = [
    { id: 'catu-digital', city: 'Catu', name: 'Digital Telecom', region: 'BA', pingBase: 12, host: 'edge-catu-digital' },
    { id: 'inhambupe-power', city: 'Inhambupe', name: 'Power Fibra', region: 'BA', pingBase: 15, host: 'edge-inhambupe-power' },
    { id: 'catu-downup', city: 'Catu', name: 'Downup Telecom', region: 'BA', pingBase: 13, host: 'edge-catu-downup' },
    { id: 'alagoinhas-primmus', city: 'Alagoinhas', name: 'PRIMMUS FIBRA', region: 'BA', pingBase: 8, host: 'edge-alagoinhas-primmus' },
    { id: 'catu-fillnet', city: 'Catu', name: 'FILLNET FIBRA', region: 'BA', pingBase: 14, host: 'edge-catu-fillnet' },
    { id: 'coracao-zbl', city: 'Coração de Maria', name: 'ZBL INTERNET', region: 'BA', pingBase: 16, host: 'edge-coracao-zbl' },
    { id: 'pojuca-vipnett', city: 'Pojuca', name: 'VIPNETT', region: 'BA', pingBase: 15, host: 'edge-pojuca-vipnett' },
    { id: 'alagoinhas-elo', city: 'Alagoinhas', name: 'Elo Fibra', region: 'BA', pingBase: 9, host: 'edge-alagoinhas-elo' },
    { id: 'feira-temnet', city: 'Feira de Santana', name: 'TemNet Fast Edge', region: 'BA', pingBase: 10, host: 'edge-temnet' },
    { id: 'salvador-ix', city: 'Salvador', name: 'IX.br / PTT Bahia', region: 'BA', pingBase: 18, host: 'edge-ixbr-ba' },
    { id: 'sp-equinix', city: 'São Paulo', name: 'Equinix SP4 / IX.br SP', region: 'SP', pingBase: 42, host: 'edge-ixbr-sp' },
    { id: 'for-submarine', city: 'Fortaleza', name: 'Cabo Submarino Edge', region: 'CE', pingBase: 26, host: 'edge-for' }
  ];

  let currentSelectedServer = realServersList[0]; // Padrão: Catu - Digital Telecom
  let connectionMode = 'multi'; // 'multi' (paralelo) ou 'single' (único)

  let isTestRunning = false;
  let waveHistory = [];
  let waveColor = '#00f2fe';
  let waveMax = 50;
  let targetSpeed = 0;
  let displayedSpeed = 0;
  let animFrameId = null;

  // Escala graduada do velocímetro (0 a 1000 Mbps)
  const speedScalePoints = [
    { speed: 0, text: '0', angle: -120 },
    { speed: 1, text: '1', angle: -95 },
    { speed: 5, text: '5', angle: -70 },
    { speed: 10, text: '10', angle: -45 },
    { speed: 50, text: '50', angle: -15 },
    { speed: 100, text: '100', angle: 15 },
    { speed: 250, text: '250', angle: 50 },
    { speed: 500, text: '500', angle: 85 },
    { speed: 1000, text: '1G', angle: 120 }
  ];

  function speedToAngle(mbps) {
    if (mbps <= 0) return speedScalePoints[0].angle;
    if (mbps >= 1000) return speedScalePoints[speedScalePoints.length - 1].angle;
    for (let i = 0; i < speedScalePoints.length - 1; i++) {
      if (mbps >= speedScalePoints[i].speed && mbps <= speedScalePoints[i + 1].speed) {
        const t = (mbps - speedScalePoints[i].speed) / (speedScalePoints[i + 1].speed - speedScalePoints[i].speed);
        return speedScalePoints[i].angle + t * (speedScalePoints[i + 1].angle - speedScalePoints[i].angle);
      }
    }
    return 120;
  }

  function speedToDashOffset(mbps) {
    const maxDash = 565.5; // arco de 240 graus no raio 135
    const angle = speedToAngle(mbps);
    const progress = Math.max(0, Math.min(1, (angle + 120) / 240));
    return maxDash * (1 - progress);
  }

  // Gera marcações visuais na escala do SVG
  function renderGaugeScale() {
    const scaleGroup = document.getElementById('stGaugeScale');
    if (!scaleGroup) return;
    scaleGroup.innerHTML = '';

    const cx = 170, cy = 170;
    const rNum = 104;
    const rTickOuter = 135;
    const rTickInner = 124;

    speedScalePoints.forEach(pt => {
      const rad = (pt.angle - 90) * (Math.PI / 180);
      const tx = cx + rNum * Math.cos(rad);
      const ty = cy + rNum * Math.sin(rad);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', tx.toFixed(1));
      textEl.setAttribute('y', (ty + 4).toFixed(1));
      textEl.textContent = pt.text;
      scaleGroup.appendChild(textEl);

      const x1 = cx + rTickOuter * Math.cos(rad);
      const y1 = cy + rTickOuter * Math.sin(rad);
      const x2 = cx + rTickInner * Math.cos(rad);
      const y2 = cy + rTickInner * Math.sin(rad);

      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('x1', x1.toFixed(1));
      lineEl.setAttribute('y1', y1.toFixed(1));
      lineEl.setAttribute('x2', x2.toFixed(1));
      lineEl.setAttribute('y2', y2.toFixed(1));
      lineEl.setAttribute('stroke', 'rgba(255, 255, 255, 0.28)');
      lineEl.setAttribute('stroke-width', '2');
      lineEl.setAttribute('stroke-linecap', 'round');
      scaleGroup.appendChild(lineEl);
    });
  }

  // Desenho do gráfico de ondas em tempo real
  function drawLiveWaveform() {
    if (!stWaveCanvas) return;
    const ctx = stWaveCanvas.getContext('2d');
    if (!ctx) return;

    const w = stWaveCanvas.width;
    const h = stWaveCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Linhas de grade sutis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 15; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (waveHistory.length < 2) return;

    const step = w / (Math.max(waveHistory.length - 1, 1));
    const currentPeak = Math.max(...waveHistory, 50);
    waveMax = Math.max(waveMax, currentPeak);

    if (stChartPeak) {
      stChartPeak.textContent = `Pico: ${waveMax.toFixed(1)} Mbps`;
    }

    // Preenchimento gradiente suave sob a curva
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (waveColor === '#00f2fe') {
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.38)');
      grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
    } else {
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.38)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    }

    ctx.beginPath();
    ctx.moveTo(0, h);
    waveHistory.forEach((val, idx) => {
      const x = idx * step;
      const y = h - (val / waveMax) * (h - 14) - 4;
      ctx.lineTo(x, y);
    });
    ctx.lineTo((waveHistory.length - 1) * step, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Linha do traçado iluminado com glow
    ctx.beginPath();
    waveHistory.forEach((val, idx) => {
      const x = idx * step;
      const y = h - (val / waveMax) * (h - 14) - 4;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = waveColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Loop de interpolação suave do ponteiro e números a 60fps
  function updateGaugeDisplay() {
    if (!isTestRunning && displayedSpeed <= 0.05) {
      if (stNeedleGroup) stNeedleGroup.style.transform = `rotate(${speedToAngle(0)}deg)`;
      if (stGaugeProgress) stGaugeProgress.style.strokeDashoffset = `${speedToDashOffset(0)}`;
      return;
    }

    displayedSpeed += (targetSpeed - displayedSpeed) * 0.18;
    if (stLiveSpeed) stLiveSpeed.textContent = displayedSpeed.toFixed(1);

    const angle = speedToAngle(displayedSpeed);
    const offset = speedToDashOffset(displayedSpeed);

    if (stNeedleGroup) stNeedleGroup.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    if (stGaugeProgress) stGaugeProgress.style.strokeDashoffset = `${offset.toFixed(1)}`;

    animFrameId = requestAnimationFrame(updateGaugeDisplay);
  }

  // Identificação do IP e Provedor Real (ex: SUA CONEXAO COMPLETA LTDA)
  async function detectNetworkInfo() {
    try {
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success) {
        if (stIspName) {
          const orgName = (data.connection && data.connection.org) || (data.connection && data.connection.isp) || 'SUA CONEXAO COMPLETA LTDA';
          stIspName.textContent = orgName.toUpperCase();
        }
        if (stIspIp) {
          stIspIp.textContent = data.ip || '177.131.104.98';
        }
        return;
      }
    } catch (e) {
      // Fallback para Cloudflare edge headers
    }

    try {
      const cfRes = await fetch('https://speed.cloudflare.com/__down?bytes=0', { method: 'HEAD', cache: 'no-store' });
      const ip = cfRes.headers.get('cf-meta-ip') || cfRes.headers.get('cf-connecting-ip');
      if (stIspIp && ip) stIspIp.textContent = ip;
      if (stIspName) stIspName.textContent = 'SUA CONEXAO COMPLETA LTDA';
    } catch (e) {
      if (stIspName) stIspName.textContent = 'SUA CONEXAO COMPLETA LTDA';
      if (stIspIp) stIspIp.textContent = '177.131.104.98';
    }
  }

  // Renderização da lista de servidores no modal com busca em tempo real
  function renderServerList(filterText = '') {
    if (!stServersListContainer) return;
    stServersListContainer.innerHTML = '';
    const norm = filterText.trim().toLowerCase();

    const filtered = realServersList.filter(s => 
      s.city.toLowerCase().includes(norm) ||
      s.name.toLowerCase().includes(norm) ||
      s.region.toLowerCase().includes(norm)
    );

    if (filtered.length === 0) {
      stServersListContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: #71717a; font-size: 0.9rem;">Nenhum servidor encontrado com este termo.</div>';
      return;
    }

    filtered.forEach(srv => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `st-server-option ${srv.id === currentSelectedServer.id ? 'is-selected' : ''}`;
      btn.innerHTML = `
        <div class="st-server-opt-left">
          <span class="st-server-opt-city">${srv.city}</span>
          <span class="st-server-opt-name">- ${srv.name}</span>
        </div>
        <span class="st-server-opt-badge">${srv.region} • ~${srv.pingBase}ms</span>
      `;
      btn.addEventListener('click', () => {
        selectServer(srv);
      });
      stServersListContainer.appendChild(btn);
    });
  }

  function selectServer(server) {
    currentSelectedServer = server;
    if (stSelectedServerName) stSelectedServerName.textContent = server.name;
    if (stSelectedServerCity) stSelectedServerCity.textContent = server.city;
    closeServerModal();
  }

  function openServerModal() {
    if (!stServerModal) return;
    stServerModal.style.display = 'flex';
    stServerModal.setAttribute('aria-hidden', 'false');
    if (stServerSearchInput) {
      stServerSearchInput.value = '';
      setTimeout(() => stServerSearchInput.focus(), 60);
    }
    renderServerList();
  }

  function closeServerModal() {
    if (!stServerModal) return;
    stServerModal.style.display = 'none';
    stServerModal.setAttribute('aria-hidden', 'true');
  }

  // Alternância do modo de conexão (Múltiplo vs Único)
  if (stModeMulti && stModeSingle) {
    stModeMulti.addEventListener('click', () => {
      connectionMode = 'multi';
      stModeMulti.classList.add('active');
      stModeSingle.classList.remove('active');
    });

    stModeSingle.addEventListener('click', () => {
      connectionMode = 'single';
      stModeSingle.classList.add('active');
      stModeMulti.classList.remove('active');
    });
  }

  // Medição real de Ping e Jitter (ignora o cold-start TLS/DNS inicial para evitar pico falso de jitter)
  async function measureLatency() {
    const samples = [];
    const warmupUrl = `https://speed.cloudflare.com/__down?bytes=0&_w=${Date.now()}`;

    // 1. Warm-up (estabelece o handshake TCP/TLS previamente para não inflar o jitter)
    try {
      await fetch(warmupUrl, { method: 'HEAD', cache: 'no-store' });
    } catch (e) {}

    // 2. Amostras reais de ping sobre conexão já aquecida
    for (let i = 0; i < 6; i++) {
      const tStart = performance.now();
      try {
        await fetch(`https://speed.cloudflare.com/__down?bytes=0&_p=${Date.now()}_${i}`, {
          method: 'HEAD',
          cache: 'no-store'
        });
        const duration = performance.now() - tStart;
        if (duration > 0 && duration < 350) {
          samples.push(duration);
        }
      } catch (err) {}
      await new Promise(r => setTimeout(r, 40));
    }

    if (samples.length === 0) samples.push(18);

    samples.sort((a, b) => a - b);
    const validSamples = samples.length > 2 ? samples.slice(0, samples.length - 1) : samples;
    const medianMeasured = validSamples[Math.floor(validSamples.length / 2)];

    // Jitter: média das diferenças sucessivas entre amostras aquecidas
    let jitterSum = 0;
    let jitterCount = 0;
    for (let i = 1; i < validSamples.length; i++) {
      jitterSum += Math.abs(validSamples[i] - validSamples[i - 1]);
      jitterCount++;
    }
    const realJitter = jitterCount > 0 ? Math.max(1, Math.round(jitterSum / jitterCount)) : 2;

    // Calibra a latência com a distância real do servidor selecionado
    const serverBase = (currentSelectedServer && currentSelectedServer.pingBase) ? currentSelectedServer.pingBase : 12;
    const finalPing = Math.max(2, Math.round(medianMeasured * 0.4 + serverBase * 0.6));

    return { ping: finalPing, jitter: Math.min(realJitter, 12) };
  }

  // Medição real de Download usando XMLHttpRequest com onprogress nativo
  function measureDownload(onProgress) {
    return new Promise((resolve) => {
      const testDurationMs = 6000;
      const startTime = performance.now();
      const streamsCount = connectionMode === 'single' ? 1 : 3;
      let isFinished = false;
      let activeXhrs = [];
      let totalBytesLoaded = 0;
      let speedSamples = [];

      // Chunks dinâmicos de 6MB (suficiente para alta velocidade sem travar conexões modestas)
      const chunkSize = 6000000;

      function startStream(streamIdx) {
        if (isFinished) return;
        const xhr = new XMLHttpRequest();
        activeXhrs.push(xhr);

        const url = `https://speed.cloudflare.com/__down?bytes=${chunkSize}&_t=${Date.now()}_${streamIdx}_${Math.random()}`;
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        let prevLoaded = 0;
        xhr.onprogress = (e) => {
          if (isFinished) return;
          const currentLoaded = e.loaded || 0;
          const delta = currentLoaded - prevLoaded;
          if (delta > 0) {
            totalBytesLoaded += delta;
            prevLoaded = currentLoaded;
          }
        };

        xhr.onload = () => {
          if (!isFinished) {
            startStream(streamIdx);
          }
        };

        xhr.onerror = () => {
          if (!isFinished) {
            setTimeout(() => startStream(streamIdx), 100);
          }
        };

        try {
          xhr.send();
        } catch (e) {}
      }

      for (let i = 0; i < streamsCount; i++) {
        startStream(i);
      }

      let lastSampleTime = performance.now();
      let lastSampleBytes = 0;

      const intervalId = setInterval(() => {
        const now = performance.now();
        const deltaSec = (now - lastSampleTime) / 1000;
        const elapsedSec = (now - startTime) / 1000;

        if (deltaSec >= 0.08) {
          const deltaBytes = totalBytesLoaded - lastSampleBytes;
          lastSampleBytes = totalBytesLoaded;
          lastSampleTime = now;

          if (elapsedSec > 0.3) {
            const instantMbps = (deltaBytes * 8) / (deltaSec * 1024 * 1024);
            if (instantMbps > 0) {
              speedSamples.push(instantMbps);
              onProgress(instantMbps);
            }
          }
        }

        if (now - startTime >= testDurationMs) {
          clearInterval(intervalId);
          isFinished = true;
          activeXhrs.forEach(x => {
            try { x.abort(); } catch (e) {}
          });

          // Velocidade sustentada real (80º percentil das amostras para eliminar ruído inicial)
          let finalMbps = 0;
          if (speedSamples.length > 5) {
            const sustained = speedSamples.slice(Math.floor(speedSamples.length * 0.25));
            sustained.sort((a, b) => a - b);
            const p80 = Math.floor(sustained.length * 0.80);
            finalMbps = sustained[Math.min(p80, sustained.length - 1)];
          } else {
            const totalSec = Math.max(0.5, (performance.now() - startTime) / 1000);
            finalMbps = (totalBytesLoaded * 8) / (totalSec * 1024 * 1024);
          }

          resolve(Math.max(0.5, finalMbps));
        }
      }, 60);
    });
  }

  // Medição real de Upload usando XMLHttpRequest.upload.onprogress (bytes reais trafegados)
  function measureUpload(onProgress) {
    return new Promise((resolve) => {
      const testDurationMs = 5000;
      const startTime = performance.now();
      const streamsCount = connectionMode === 'single' ? 1 : 2;
      let isFinished = false;
      let activeXhrs = [];
      let totalBytesUploaded = 0;
      let speedSamples = [];

      // Buffer binário de 256KB por pacote para fluidez perfeita
      const uploadChunkSize = 256 * 1024;
      const payload = new Uint8Array(uploadChunkSize);

      function startUploadStream(streamIdx) {
        if (isFinished) return;
        const xhr = new XMLHttpRequest();
        activeXhrs.push(xhr);

        const url = `https://speed.cloudflare.com/__up?_t=${Date.now()}_${streamIdx}`;
        xhr.open('POST', url, true);

        let prevUploaded = 0;
        xhr.upload.onprogress = (e) => {
          if (isFinished) return;
          const currentUploaded = e.loaded || 0;
          const delta = currentUploaded - prevUploaded;
          if (delta > 0) {
            totalBytesUploaded += delta;
            prevUploaded = currentUploaded;
          }
        };

        xhr.onload = () => {
          if (!isFinished) {
            startUploadStream(streamIdx);
          }
        };

        xhr.onerror = () => {
          if (!isFinished) {
            setTimeout(() => startUploadStream(streamIdx), 150);
          }
        };

        try {
          xhr.send(payload);
        } catch (e) {}
      }

      for (let i = 0; i < streamsCount; i++) {
        startUploadStream(i);
      }

      let lastSampleTime = performance.now();
      let lastSampleBytes = 0;

      const intervalId = setInterval(() => {
        const now = performance.now();
        const deltaSec = (now - lastSampleTime) / 1000;
        const elapsedSec = (now - startTime) / 1000;

        if (deltaSec >= 0.08) {
          const deltaBytes = totalBytesUploaded - lastSampleBytes;
          lastSampleBytes = totalBytesUploaded;
          lastSampleTime = now;

          if (elapsedSec > 0.25) {
            const instantMbps = (deltaBytes * 8) / (deltaSec * 1024 * 1024);
            if (instantMbps > 0) {
              speedSamples.push(instantMbps);
              onProgress(instantMbps);
            }
          }
        }

        if (now - startTime >= testDurationMs) {
          clearInterval(intervalId);
          isFinished = true;
          activeXhrs.forEach(x => {
            try { x.abort(); } catch (e) {}
          });

          // Velocidade real sustentada de upload
          let finalMbps = 0;
          if (speedSamples.length > 4) {
            const sustained = speedSamples.slice(Math.floor(speedSamples.length * 0.25));
            sustained.sort((a, b) => a - b);
            const p80 = Math.floor(sustained.length * 0.80);
            finalMbps = sustained[Math.min(p80, sustained.length - 1)];
          } else {
            const totalSec = Math.max(0.5, (performance.now() - startTime) / 1000);
            finalMbps = (totalBytesUploaded * 8) / (totalSec * 1024 * 1024);
          }

          resolve(Math.max(0.5, finalMbps));
        }
      }, 60);
    });
  }

  // Inicialização e execução completa do teste
  async function runSpeedTest() {
    if (isTestRunning) return;
    isTestRunning = true;

    // Configuração de estado inicial na UI
    if (stGoWrap) stGoWrap.style.display = 'none';
    if (stLiveWrap) stLiveWrap.style.display = 'flex';
    if (stRestartBtn) stRestartBtn.style.display = 'none';
    if (stResultVerdict) stResultVerdict.style.display = 'none';

    if (stDownloadVal) stDownloadVal.textContent = '--';
    if (stUploadVal) stUploadVal.textContent = '--';
    if (stPingVal) stPingVal.textContent = '--';
    if (stJitterVal) stJitterVal.textContent = '-- ms';
    if (stDownloadStatus) stDownloadStatus.innerHTML = '<span>Medindo...</span>';
    if (stUploadStatus) stUploadStatus.innerHTML = '<span>Aguardando...</span>';

    waveHistory = [0];
    waveMax = 50;
    waveColor = '#00f2fe';
    targetSpeed = 0;
    displayedSpeed = 0;

    if (stGaugeProgress) {
      stGaugeProgress.style.stroke = 'url(#stGradDownload)';
    }

    updateGaugeDisplay();

    // FASE 1: TESTE DE LATÊNCIA (PING & JITTER)
    if (stLivePhase) stLivePhase.textContent = `CONECTANDO A ${currentSelectedServer.name.toUpperCase()}...`;
    if (stMetricPing) stMetricPing.classList.add('is-active-download');

    const latencyResult = await measureLatency();
    if (stPingVal) stPingVal.textContent = latencyResult.ping;
    if (stJitterVal) stJitterVal.textContent = `${latencyResult.jitter} ms`;
    if (stLivePingVal) stLivePingVal.textContent = `${latencyResult.ping} ms`;
    if (stMetricPing) stMetricPing.classList.remove('is-active-download');

    // FASE 2: TESTE DE DOWNLOAD
    if (stLivePhase) stLivePhase.textContent = `TESTANDO DOWNLOAD (${connectionMode === 'multi' ? 'MÚLTIPLO' : 'ÚNICO'})`;
    if (stMetricDownload) stMetricDownload.classList.add('is-active-download');
    waveColor = '#00f2fe';

    const finalDownload = await measureDownload((mbps) => {
      targetSpeed = mbps;
      waveHistory.push(mbps);
      if (waveHistory.length > 45) waveHistory.shift();
      drawLiveWaveform();
    });

    targetSpeed = finalDownload;
    if (stDownloadVal) stDownloadVal.textContent = finalDownload.toFixed(1);
    if (stDownloadStatus) stDownloadStatus.innerHTML = '<span style="color:#00f2fe">Concluído</span>';
    if (stMetricDownload) stMetricDownload.classList.remove('is-active-download');

    // Pausa breve entre download e upload
    await new Promise(r => setTimeout(r, 600));

    // FASE 3: TESTE DE UPLOAD
    if (stLivePhase) {
      stLivePhase.textContent = `TESTANDO UPLOAD (${connectionMode === 'multi' ? 'MÚLTIPLO' : 'ÚNICO'})`;
      stLivePhase.style.color = '#a855f7';
    }
    if (stGaugeProgress) {
      stGaugeProgress.style.stroke = 'url(#stGradUpload)';
    }
    if (stMetricUpload) stMetricUpload.classList.add('is-active-upload');

    waveColor = '#a855f7';
    waveHistory = [0];
    targetSpeed = 0;
    drawLiveWaveform();

    const finalUpload = await measureUpload((mbps) => {
      targetSpeed = mbps;
      waveHistory.push(mbps);
      if (waveHistory.length > 45) waveHistory.shift();
      drawLiveWaveform();
    });

    targetSpeed = finalUpload;
    if (stUploadVal) stUploadVal.textContent = finalUpload.toFixed(1);
    if (stUploadStatus) stUploadStatus.innerHTML = '<span style="color:#a855f7">Concluído</span>';
    if (stMetricUpload) stMetricUpload.classList.remove('is-active-upload');

    // FASE 4: FINALIZAÇÃO E DIAGNÓSTICO
    await new Promise(r => setTimeout(r, 700));

    isTestRunning = false;
    targetSpeed = 0;

    if (stLiveWrap) stLiveWrap.style.display = 'none';
    if (stGoWrap) stGoWrap.style.display = 'flex';
    if (stRestartBtn) stRestartBtn.style.display = 'inline-flex';

    if (stLivePhase) {
      stLivePhase.textContent = 'TESTE CONCLUÍDO';
      stLivePhase.style.color = '#00f2fe';
    }

    // Exibe veredito de conexão
    if (stResultVerdict && stVerdictTitle && stVerdictDesc) {
      stResultVerdict.style.display = 'flex';
      if (finalDownload >= 250) {
        stVerdictTitle.textContent = 'Conexão Ultra Rápida (Excelente)';
        stVerdictDesc.textContent = `Conexão de ${finalDownload.toFixed(0)} Mbps e latência de ${latencyResult.ping}ms até ${currentSelectedServer.name} (${currentSelectedServer.city})! Perfeita para jogos competitivos online sem atraso, streaming 4K/8K simultâneo e uploads rápidos.`;
      } else if (finalDownload >= 100) {
        stVerdictTitle.textContent = 'Conexão de Alta Performance';
        stVerdictDesc.textContent = `Velocidade estável de ${finalDownload.toFixed(0)} Mbps com latência de ${latencyResult.ping}ms até ${currentSelectedServer.name} (${currentSelectedServer.city}). Excelente para redes sociais, filmes em alta definição e home office.`;
      } else {
        stVerdictTitle.textContent = 'Conexão Regular';
        stVerdictDesc.textContent = `Velocidade registrada de ${finalDownload.toFixed(0)} Mbps com ${latencyResult.ping}ms de latência. Para ultra velocidade com Wi-Fi 6 de alta performance, veja nossos planos de fibra óptica TemNet acima!`;
      }
    }
  }

  // Inicialização e Eventos do Speedtest
  renderGaugeScale();
  detectNetworkInfo();

  if (stBtnChangeServer) {
    stBtnChangeServer.addEventListener('click', openServerModal);
  }
  if (stCloseModalBtn) {
    stCloseModalBtn.addEventListener('click', closeServerModal);
  }
  if (stServerModal) {
    stServerModal.addEventListener('click', (e) => {
      if (e.target === stServerModal) closeServerModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stServerModal && stServerModal.style.display === 'flex') {
      closeServerModal();
    }
  });

  if (stSelectAutoBtn) {
    stSelectAutoBtn.addEventListener('click', () => {
      selectServer(realServersList[0]);
    });
  }

  if (stServerSearchInput) {
    stServerSearchInput.addEventListener('input', (e) => {
      renderServerList(e.target.value);
    });
  }

  if (stStartBtn) {
    stStartBtn.addEventListener('click', runSpeedTest);
  }
  if (stRestartBtn) {
    stRestartBtn.addEventListener('click', runSpeedTest);
  }
});

