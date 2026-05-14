const express = require('express');
const app = express();

// Cette page s'affichera directement - PAS de fichier externe
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MyProfEduc</title>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-12">
        <!-- Navigation -->
        <nav class="bg-white rounded-2xl shadow-lg p-4 mb-8 flex justify-between items-center">
            <div class="text-2xl font-bold text-blue-600">🎓 MyProfEduc</div>
            <div class="space-x-4">
                <button onclick="showPage('home')" class="text-gray-600 hover:text-blue-600">Accueil</button>
                <button onclick="showPage('teachers')" class="text-gray-600 hover:text-blue-600">Enseignants</button>
                <button onclick="showPage('register')" class="text-gray-600 hover:text-blue-600">Inscription</button>
                <button id="loginBtn" onclick="openLoginModal()" class="bg-blue-600 text-white px-4 py-2 rounded-full">Connexion</button>
                <button id="logoutBtn" onclick="logout()" class="hidden bg-red-500 text-white px-4 py-2 rounded-full">Déconnexion</button>
            </div>
        </nav>

        <!-- Page Accueil -->
        <div id="homePage">
            <div class="text-center py-12">
                <h1 class="text-5xl font-bold text-blue-600 mb-4">Cours particuliers sans commission</h1>
                <p class="text-xl text-gray-600 mb-8">Économisez 50% par rapport aux agences traditionnelles</p>
                <button onclick="showPage('register')" class="bg-blue-600 text-white px-6 py-3 rounded-full text-lg">Inscription gratuite</button>
                <button onclick="showPage('teachers')" class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-full text-lg ml-4">Trouver un prof</button>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow text-center"><div class="text-4xl mb-2">🔍</div><h3 class="font-bold text-xl">Recherchez</h3><p>Trouvez le professeur idéal</p></div>
                <div class="bg-white p-6 rounded-xl shadow text-center"><div class="text-4xl mb-2">🤝</div><h3 class="font-bold text-xl">Contact direct</h3><p>Échangez sans intermédiaire</p></div>
                <div class="bg-white p-6 rounded-xl shadow text-center"><div class="text-4xl mb-2">💰</div><h3 class="font-bold text-xl">0% commission</h3><p>Payez l'enseignant directement</p></div>
            </div>
        </div>

        <!-- Page Enseignants -->
        <div id="teachersPage" class="hidden">
            <h2 class="text-3xl font-bold mb-6">Nos enseignants</h2>
            <div id="teachersList" class="grid md:grid-cols-3 gap-6"></div>
        </div>

        <!-- Page Inscription -->
        <div id="registerPage" class="hidden max-w-md mx-auto bg-white p-8 rounded-xl shadow">
            <h2 class="text-2xl font-bold mb-6 text-center">Inscription</h2>
            <input type="text" id="regName" placeholder="Nom complet" class="w-full border rounded-lg p-3 mb-4">
            <input type="email" id="regEmail" placeholder="Email" class="w-full border rounded-lg p-3 mb-4">
            <input type="password" id="regPassword" placeholder="Mot de passe" class="w-full border rounded-lg p-3 mb-4">
            <select id="regRole" class="w-full border rounded-lg p-3 mb-4">
                <option value="parent">Parent</option>
                <option value="teacher">Enseignant</option>
            </select>
            <button onclick="register()" class="w-full bg-blue-600 text-white py-3 rounded-lg">S'inscrire</button>
        </div>

        <!-- Page Profil -->
        <div id="profilePage" class="hidden max-w-md mx-auto bg-white p-8 rounded-xl shadow">
            <h2 class="text-2xl font-bold mb-6">Mon profil</h2>
            <div id="profileInfo"></div>
            <button onclick="logout()" class="mt-4 bg-red-500 text-white px-4 py-2 rounded">Déconnexion</button>
        </div>
    </div>

    <!-- Modal Connexion -->
    <div id="loginModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-xl w-96">
            <h3 class="text-xl font-bold mb-4">Connexion</h3>
            <input type="email" id="loginEmail" placeholder="Email" class="w-full border rounded-lg p-3 mb-4">
            <input type="password" id="loginPassword" placeholder="Mot de passe" class="w-full border rounded-lg p-3 mb-4">
            <button onclick="login()" class="w-full bg-blue-600 text-white py-3 rounded-lg">Se connecter</button>
            <button onclick="closeModal('loginModal')" class="w-full mt-2 text-gray-500">Fermer</button>
        </div>
    </div>

    <script>
        // Données simulées
        const teachersData = [
            { id: 1, name: "Sophie Martin", subject: "Mathématiques", city: "Paris", hourly_rate: 25, bio: "Professeur passionné" },
            { id: 2, name: "Thomas Bernard", subject: "Physique", city: "Lyon", hourly_rate: 30, bio: "Docteur en physique" },
            { id: 3, name: "Émilie Petit", subject: "Français", city: "Toulouse", hourly_rate: 22, bio: "Lettres modernes" }
        ];

        function showPage(page) {
            document.getElementById('homePage').classList.add('hidden');
            document.getElementById('teachersPage').classList.add('hidden');
            document.getElementById('registerPage').classList.add('hidden');
            document.getElementById('profilePage').classList.add('hidden');
            document.getElementById(page + 'Page').classList.remove('hidden');
            if(page === 'teachers') loadTeachers();
            if(page === 'profile') loadProfile();
        }

        function loadTeachers() {
            document.getElementById('teachersList').innerHTML = teachersData.map(t => 
                '<div class="bg-white p-6 rounded-xl shadow">' +
                    '<h3 class="text-xl font-bold">' + t.name + '</h3>' +
                    '<p class="text-blue-600">' + t.subject + '</p>' +
                    '<p>📍 ' + t.city + '</p>' +
                    '<p class="text-2xl font-bold text-green-600">' + t.hourly_rate + '€/h</p>' +
                '</div>'
            ).join('');
        }

        function register() {
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            if(name && email && password) {
                alert('Inscription réussie ! Vous pouvez vous connecter.');
                showPage('home');
            } else {
                alert('Veuillez remplir tous les champs');
            }
        }

        function login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            if(email && password) {
                localStorage.setItem('user', JSON.stringify({ name: "Utilisateur", email: email, role: "parent" }));
                updateUI();
                closeModal('loginModal');
                showPage('profile');
                alert('Connexion réussie !');
            } else {
                alert('Email et mot de passe requis');
            }
        }

        function logout() {
            localStorage.removeItem('user');
            updateUI();
            showPage('home');
        }

        function updateUI() {
            const user = localStorage.getItem('user');
            document.getElementById('loginBtn').classList.toggle('hidden', !!user);
            document.getElementById('logoutBtn').classList.toggle('hidden', !user);
        }

        function loadProfile() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            document.getElementById('profileInfo').innerHTML = 
                '<p><strong>' + (user.name || 'Utilisateur') + '</strong></p>' +
                '<p>Email: ' + (user.email || '') + '</p>' +
                '<p>Rôle: ' + (user.role || 'parent') + '</p>';
        }

        function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
        function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

        window.onclick = (e) => { if(e.target.classList.contains('fixed')) e.target.classList.add('hidden'); }
        
        updateUI();
        loadTeachers();
    </script>
</body>
</html>
    `);
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.get('/api/teachers', (req, res) => {
    res.json([
        { id: 1, name: "Sophie Martin", subject: "Mathématiques", city: "Paris", hourly_rate: 25 },
        { id: 2, name: "Thomas Bernard", subject: "Physique", city: "Lyon", hourly_rate: 30 },
        { id: 3, name: "Émilie Petit", subject: "Français", city: "Toulouse", hourly_rate: 22 }
    ]);
});

app.post('/api/auth/register', (req, res) => {
    res.json({ message: 'Inscription réussie' });
});

app.post('/api/auth/login', (req, res) => {
    res.json({ token: 'demo-token', user: { name: "Test", email: req.body.email, role: "parent" } });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('✅ MyProfEduc est OPERATIONNEL !');
    console.log('🌐 Ouvrez http://localhost:3000');
    console.log('========================================\n');
});