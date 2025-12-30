        let allProjects = [];
        let currentCategory = '';

        function showHome() {
            document.getElementById('homePage').style.display = 'block';
            document.getElementById('projectsPage').style.display = 'none';
            document.getElementById('blogPage').style.display = 'none';
            document.getElementById('articlePage').style.display = 'none';
            document.getElementById('licensesSection').style.display = 'block';

            // Update navbar active state
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.querySelector('.nav-link:nth-child(1)').classList.add('active');
        }

		function showCategory(categoryKey) {
			currentCategory = categoryKey;
			const category = categories[categoryKey];
			allProjects = category.projects;
		
			document.getElementById('categoryTitle').textContent = category.title;
			document.getElementById('categorySubtitle').textContent = category.subtitle;
		
			document.getElementById('homePage').style.display = 'none';
			document.getElementById('projectsPage').style.display = 'block';
		
			// Popular filtro de licenças
			populateLicenseFilter();
			
			// Resetar filtros
			document.getElementById('searchInput').value = '';
			document.getElementById('licenseFilter').value = 'all';
			document.getElementById('sortFilter').value = 'default';
			
			renderProjects(allProjects);
		}
		
		function populateLicenseFilter() {
			const licenses = [...new Set(allProjects.map(p => p.license))].sort();
			const licenseFilter = document.getElementById('licenseFilter');
			
			// Limpar options exceto o primeiro
			licenseFilter.innerHTML = '<option value="all">Todas as Licenças</option>';
			
			licenses.forEach(license => {
				const option = document.createElement('option');
				option.value = license;
				option.textContent = license;
				licenseFilter.appendChild(option);
			});
		}
		
		function applyFilters() {
			const searchTerm = document.getElementById('searchInput').value.toLowerCase();
			const licenseFilter = document.getElementById('licenseFilter').value;
			const sortFilter = document.getElementById('sortFilter').value;
			
			let filtered = allProjects;
			
			// Filtro de busca
			if (searchTerm) {
				filtered = filtered.filter(p =>
					p.title.toLowerCase().includes(searchTerm) ||
					p.description.toLowerCase().includes(searchTerm) ||
					p.license.toLowerCase().includes(searchTerm)
				);
			}
			
			// Filtro de licença
			if (licenseFilter !== 'all') {
				filtered = filtered.filter(p => p.license === licenseFilter);
			}
			
			// Ordenação
			if (sortFilter === 'name-asc') {
				filtered.sort((a, b) => a.title.localeCompare(b.title));
			} else if (sortFilter === 'name-desc') {
				filtered.sort((a, b) => b.title.localeCompare(a.title));
			} else if (sortFilter === 'license-asc') {
				filtered.sort((a, b) => a.license.localeCompare(b.license));
			} else if (sortFilter === 'license-desc') {
				filtered.sort((a, b) => b.license.localeCompare(a.license));
			}
			
			renderProjects(filtered);
		}
		
		// Atualizar event listeners
		document.getElementById('searchInput').addEventListener('input', applyFilters);
		document.getElementById('licenseFilter').addEventListener('change', applyFilters);
		document.getElementById('sortFilter').addEventListener('change', applyFilters);
        function renderProjects(projects) {
            const tbody = document.getElementById('projectsTableBody');
            tbody.innerHTML = projects.map(project => `
                <tr>
                    <td class="project-title-cell">${project.title}</td>
                    <td><span class="license-badge">${project.license}</span></td>
                    <td>${project.description}</td>
                    <td>
                        <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="github-link">
                            Ver no GitHub →
                        </a>
                    </td>
                </tr>
            `).join('');
        }

        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allProjects.filter(p =>
                p.title.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.license.toLowerCase().includes(searchTerm)
            );
            renderProjects(filtered);
        });

function showBlog() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('projectsPage').style.display = 'none';
    document.getElementById('articlePage').style.display = 'none';
    document.getElementById('blogPage').style.display = 'block';
    document.getElementById('licensesSection').style.display = 'none';

    // Update navbar active state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link:nth-child(2)').classList.add('active');
}

function showAboutModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'aboutModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeAboutModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Sobre o GitGuide</h2>
                    <button class="modal-close" onclick="closeAboutModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="about-content">
                        <div class="about-text">
                            <p>O GitGuide é uma biblioteca completa e organizada de mais de 1000 projetos open source disponíveis no GitHub. Nossa missão é ajudar desenvolvedores, estudantes e empresas a descobrir ferramentas incríveis que podem acelerar seus projetos e melhorar sua produtividade.</p>

                            <p>Aqui você encontra projetos categorizados por área de atuação, com informações detalhadas sobre licenças, descrições e links diretos para os repositórios oficiais. Todos os projetos listados seguem licenças open source que permitem uso comercial, garantindo que você possa utilizá-los com segurança em seus projetos pessoais ou empresariais.</p>

                            <div class="about-stats">
                                <div class="about-stat">
                                    <span class="about-number">1000+</span>
                                    <span class="about-label">Projetos</span>
                                </div>
                                <div class="about-stat">
                                    <span class="about-number">21</span>
                                    <span class="about-label">Categorias</span>
                                </div>
                                <div class="about-stat">
                                    <span class="about-number">100%</span>
                                    <span class="about-label">Open Source</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update navbar active state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link:nth-child(3)').classList.add('active');
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.remove();
        // Remove active state from navbar
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        // Set Home as active (default state)
        document.querySelector('.nav-link:nth-child(1)').classList.add('active');
    }
}

function showArticle(articleId) {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('projectsPage').style.display = 'none';
    document.getElementById('blogPage').style.display = 'none';
    document.getElementById('articlePage').style.display = 'block';
    
    loadArticle(articleId);
}


    // Inicializar mostrando a home
    showHome();

    function toggleLicenses() {
        const content = document.getElementById('licensesContent');
        const button = event.target;
        content.classList.toggle('show');
    }

    function toggleAccordion(header) {
        const content = header.nextElementSibling;
        const isOpen = content.classList.contains('open');

        // Toggle classes
        header.classList.toggle('active');
        content.classList.toggle('open');
    }
