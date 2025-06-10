// Класс для создания интерактивной анимации частиц
class ParticleNetwork {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.particleCount = 100;
    this.maxDistance = 100;
    this.colors = ['#3498db', '#2980b9', '#1abc9c', '#16a085'];
    
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
  }
  
  createParticles() {
    // Создаем геометрию для всех частиц
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];
    const colors = [];
    
    // Создаем материал для частиц
    const material = new THREE.PointsMaterial({
      size: 4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    // Создаем частицы с случайными позициями
    for (let i = 0; i < this.particleCount; i++) {
      // Случайные координаты в пределах видимой области
      const x = Math.random() * window.innerWidth - window.innerWidth / 2;
      const y = Math.random() * window.innerHeight - window.innerHeight / 2;
      const z = Math.random() * 100 - 50;
      
      vertices.push(x, y, z);
      
      // Случайный размер
      sizes.push(Math.random() * 2 + 1);
      
      // Случайный цвет из палитры
      const color = new THREE.Color(this.colors[Math.floor(Math.random() * this.colors.length)]);
      colors.push(color.r, color.g, color.b);
      
      // Создаем объект частицы с дополнительными свойствами для анимации
      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        originalSize: sizes[i]
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
  
  createLines() {
    // Создаем материал для линий
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.2
    });
    
    this.lines = [];
    
    // Будем создавать линии динамически в методе анимации
  }
  
  updateParticles() {
    const positions = this.particleSystem.geometry.attributes.position;
    const sizes = this.particleSystem.geometry.attributes.size;
    
    // Обновляем позиции частиц
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Обновляем позицию на основе скорости
      particle.position.add(particle.velocity);
      
      // Отражаем частицы от границ
      if (particle.position.x < -window.innerWidth / 2 || particle.position.x > window.innerWidth / 2) {
        particle.velocity.x = -particle.velocity.x;
      }
      
      if (particle.position.y < -window.innerHeight / 2 || particle.position.y > window.innerHeight / 2) {
        particle.velocity.y = -particle.velocity.y;
      }
      
      if (particle.position.z < -50 || particle.position.z > 50) {
        particle.velocity.z = -particle.velocity.z;
      }
      
      // Обновляем позицию в буфере
      positions.array[i * 3] = particle.position.x;
      positions.array[i * 3 + 1] = particle.position.y;
      positions.array[i * 3 + 2] = particle.position.z;
    }
    
    // Помечаем атрибуты как требующие обновления
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    
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
      for (let j = i + 1; j < this.particles.length; j++) {
        const distance = this.particles[i].position.distanceTo(this.particles[j].position);
        
        // Если частицы достаточно близко, создаем линию между ними
        if (distance < this.maxDistance) {
          const opacity = 1 - (distance / this.maxDistance);
          const geometry = new THREE.BufferGeometry().setFromPoints([
            this.particles[i].position,
            this.particles[j].position
          ]);
          
          const material = new THREE.LineBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: opacity * 0.2
          });
          
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.lines.push(line);
          
          // Ограничиваем количество линий для производительности
          if (this.lines.length > 100) break;
        }
      }
      
      // Ограничиваем количество линий для производительности
      if (this.lines.length > 100) break;
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
      
      // Если мышь близко к частице, увеличиваем её размер
      if (distance < 100) {
        const scale = 1 + (1 - distance / 100) * 2;
        sizes.array[i] = particle.originalSize * scale;
        
        // Также слегка притягиваем частицу к мыши
        const direction = new THREE.Vector3().subVectors(mousePosition, particle.position).normalize();
        particle.velocity.add(direction.multiplyScalar(0.01));
      } else {
        // Возвращаем исходный размер
        sizes.array[i] = particle.originalSize;
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