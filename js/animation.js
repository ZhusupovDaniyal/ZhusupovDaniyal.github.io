// Класс для создания интерактивной анимации частиц
class ParticleNetwork {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.particleCount = 150; // Увеличиваем количество частиц
    this.maxDistance = 120;
    
    // Добавляем градиентные цвета для более красивого эффекта
    this.colors = [
      '#3498db', '#2980b9', '#1abc9c', '#16a085', 
      '#9b59b6', '#8e44ad', '#34495e', '#2c3e50'
    ];
    
    // Время для волновых эффектов
    this.time = 0;
    this.waveSpeed = 0.002;
    
    this.init();
    this.animate();
    
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  init() {
    // Создаем сцену, камеру и рендерер
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    
    // Настраиваем рендерер
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Прозрачный фон
    this.container.appendChild(this.renderer.domElement);
    
    // Позиционируем камеру
    this.camera.position.z = 200;
    
    // Создаем частицы
    this.createParticles();
    
    // Добавляем обработчик движения мыши
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Добавляем обработчик касания для мобильных устройств
    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.onMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY
        });
      }
    });
  }
  
  createParticles() {
    // Создаем геометрию для всех частиц
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];
    const colors = [];
    
    // Создаем текстуру для частиц (более мягкая точка)
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = this.createCircleTexture();
    
    // Создаем материал для частиц
    const material = new THREE.PointsMaterial({
      size: 5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      map: particleTexture,
      blending: THREE.AdditiveBlending, // Добавляем аддитивное смешивание для красивого свечения
      depthWrite: false // Отключаем запись в буфер глубины для правильного смешивания
    });
    
    // Создаем частицы с случайными позициями
    for (let i = 0; i < this.particleCount; i++) {
      // Случайные координаты в пределах видимой области
      // Используем сферическое распределение для более равномерного заполнения
      const radius = Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi) - 100; // Смещаем немного назад
      
      vertices.push(x, y, z);
      
      // Случайный размер с большей вариацией
      const size = Math.random() * 3 + 1;
      sizes.push(size);
      
      // Случайный цвет из палитры
      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = new THREE.Color(this.colors[colorIndex]);
      colors.push(color.r, color.g, color.b);
      
      // Создаем объект частицы с дополнительными свойствами для анимации
      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        ),
        originalSize: size,
        originalZ: z,
        colorIndex: colorIndex,
        phase: Math.random() * Math.PI * 2 // Фаза для волнового движения
      });
    }
    
    // Добавляем атрибуты в геометрию
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Создаем систему частиц и добавляем на сцену
    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
    
    // Создаем линии между частицами
    this.createLines();
  }
  
  // Создаем текстуру круга для частиц
  createCircleTexture() {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Создаем градиент
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Рисуем круг с градиентом
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    
    // Создаем текстуру из канваса
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  createLines() {
    // Создаем материал для линий
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.lines = [];
    
    // Будем создавать линии динамически в методе анимации
  }
  
  updateParticles() {
    const positions = this.particleSystem.geometry.attributes.position;
    const sizes = this.particleSystem.geometry.attributes.size;
    const colors = this.particleSystem.geometry.attributes.color;
    
    // Увеличиваем время для волновых эффектов
    this.time += this.waveSpeed;
    
    // Обновляем позиции частиц
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Добавляем волновое движение
      const waveX = Math.sin(this.time + particle.phase) * 0.5;
      const waveY = Math.cos(this.time + particle.phase * 0.8) * 0.5;
      
      // Обновляем позицию на основе скорости и волн
      particle.position.add(particle.velocity);
      particle.position.x += waveX;
      particle.position.y += waveY;
      
      // Отражаем частицы от границ с небольшим запасом
      const boundsX = window.innerWidth / 2 + 50;
      const boundsY = window.innerHeight / 2 + 50;
      const boundsZ = 150;
      
      if (particle.position.x < -boundsX || particle.position.x > boundsX) {
        particle.velocity.x = -particle.velocity.x;
        particle.position.x = Math.max(-boundsX, Math.min(boundsX, particle.position.x));
      }
      
      if (particle.position.y < -boundsY || particle.position.y > boundsY) {
        particle.velocity.y = -particle.velocity.y;
        particle.position.y = Math.max(-boundsY, Math.min(boundsY, particle.position.y));
      }
      
      if (particle.position.z < -boundsZ || particle.position.z > boundsZ) {
        particle.velocity.z = -particle.velocity.z;
        particle.position.z = Math.max(-boundsZ, Math.min(boundsZ, particle.position.z));
      }
      
      // Пульсация размера
      const pulseFactor = 1 + Math.sin(this.time * 2 + particle.phase) * 0.2;
      sizes.array[i] = particle.originalSize * pulseFactor;
      
      // Плавное изменение цвета
      const colorShift = Math.sin(this.time + i * 0.1) * 0.5 + 0.5;
      const color1 = new THREE.Color(this.colors[particle.colorIndex]);
      const nextColorIndex = (particle.colorIndex + 1) % this.colors.length;
      const color2 = new THREE.Color(this.colors[nextColorIndex]);
      const mixedColor = color1.clone().lerp(color2, colorShift);
      
      colors.array[i * 3] = mixedColor.r;
      colors.array[i * 3 + 1] = mixedColor.g;
      colors.array[i * 3 + 2] = mixedColor.b;
      
      // Обновляем позицию в буфере
      positions.array[i * 3] = particle.position.x;
      positions.array[i * 3 + 1] = particle.position.y;
      positions.array[i * 3 + 2] = particle.position.z;
    }
    
    // Помечаем атрибуты как требующие обновления
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    colors.needsUpdate = true;
    
    // Обновляем линии между частицами
    this.updateLines();
  }
  
  updateLines() {
    // Удаляем предыдущие линии со сцены
    for (let i = 0; i < this.lines.length; i++) {
      this.scene.remove(this.lines[i]);
    }
    this.lines = [];
    
    // Создаем новые линии между близкими частицами
    for (let i = 0; i < this.particles.length; i++) {
      // Для производительности проверяем только каждую n-ю частицу
      if (i % 3 !== 0) continue;
      
      for (let j = i + 1; j < this.particles.length; j++) {
        // Для производительности проверяем только каждую n-ю частицу
        if (j % 3 !== 0) continue;
        
        const distance = this.particles[i].position.distanceTo(this.particles[j].position);
        
        // Если частицы достаточно близко, создаем линию между ними
        if (distance < this.maxDistance) {
          // Делаем прозрачность зависимой от расстояния
          const opacity = (1 - (distance / this.maxDistance)) * 0.2;
          
          const geometry = new THREE.BufferGeometry().setFromPoints([
            this.particles[i].position,
            this.particles[j].position
          ]);
          
          // Используем цвет, смешанный из цветов частиц
          const color1 = new THREE.Color(this.colors[this.particles[i].colorIndex]);
          const color2 = new THREE.Color(this.colors[this.particles[j].colorIndex]);
          const mixedColor = color1.clone().lerp(color2, 0.5);
          
          const material = new THREE.LineBasicMaterial({
            color: mixedColor,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.lines.push(line);
          
          // Ограничиваем количество линий для производительности
          if (this.lines.length > 150) break;
        }
      }
      
      // Ограничиваем количество линий для производительности
      if (this.lines.length > 150) break;
    }
  }
  
  onMouseMove(event) {
    // Преобразуем координаты мыши в координаты сцены
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Создаем вектор для позиции мыши
    const mousePosition = new THREE.Vector3(
      mouseX * window.innerWidth / 2,
      mouseY * window.innerHeight / 2,
      0
    );
    
    // Взаимодействуем с частицами
    const sizes = this.particleSystem.geometry.attributes.size;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const distance = mousePosition.distanceTo(particle.position);
      
      // Если мышь близко к частице, увеличиваем её размер и меняем цвет
      if (distance < 120) {
        const scale = 1 + (1 - distance / 120) * 3;
        sizes.array[i] = particle.originalSize * scale;
        
        // Также слегка притягиваем частицу к мыши
        const direction = new THREE.Vector3().subVectors(mousePosition, particle.position).normalize();
        particle.velocity.add(direction.multiplyScalar(0.02));
        
        // Ограничиваем максимальную скорость
        const maxSpeed = 0.8;
        const speed = particle.velocity.length();
        if (speed > maxSpeed) {
          particle.velocity.multiplyScalar(maxSpeed / speed);
        }
      }
    }
    
    sizes.needsUpdate = true;
  }
  
  onWindowResize() {
    // Обновляем размеры при изменении окна
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Обновляем частицы
    this.updateParticles();
    
    // Медленно вращаем камеру для создания эффекта движения
    this.camera.position.x = Math.sin(this.time * 0.2) * 30;
    this.camera.position.y = Math.cos(this.time * 0.1) * 20;
    this.camera.lookAt(0, 0, 0);
    
    // Рендерим сцену
    this.renderer.render(this.scene, this.camera);
  }
}

// Инициализируем анимацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('background-animation');
  if (container) {
    new ParticleNetwork(container);
  }
}); 